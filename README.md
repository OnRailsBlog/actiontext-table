# README
## Tables in ActionText

First, I’d like to thank [Chris Oliver](https://twitter.com/excid3) for his wonderful Railsconf 2020.2 talk, [ Advanced ActionText: Attaching any model in rich text](http://railsconf.org/2020/video/chris-oliver-advanced-actiontext-attaching-any-model-in-rich-text "Advanced ActionText: Attaching any model in rich text"). I’d highly recommend you watching that first for context, as I’m going to implement this ActionText table based on his Youtube preview.

Towards the end of the video, Chris mentions you could use the attachment framework in [ActionText](https://guides.rubyonrails.org/action_text_overview.html) for all sorts of things, including tables. This is something I’d been interested in adding to my own apps, so I wanted to work from his example, and see what was possible. 

ActionText is _very_ conservative in what html tags are allowed, but it can be configured to support more tags, like `<table>`, `<tr>`, and `<td>`. A button is added to Trix that creates the table when clicked. The table needs some interactivity, which is accomplished with a Stimulus.js controller. This functionality is basic table operations you’d expect, such as adding rows and columns, entering data, and most importantly, having all that information saved.

## Rails New
Create a new rails app. This app will use Stimulus to handle the interactivity of adding and manipulating a table in the post’s rich text body, so be sure to add the webpack switch.
```bash
rails new actiontext-table --webpack=stimulus
```

Install ActionText in the app:
```bash
rails action_text:install
```

Create a Post model and the scaffolding to start quickly:
```bash
rails g scaffold Post body:rich_text
```
You now have the rich text form at `/posts/new`.

There is some css added in `posts.scss`, taken from bulma.io, that will allow the table to be see once it’s added to Trix. Add it to `application.css`:
```css
table {
	border-collapse: collapse;
	border-spacing:0
}

td, th {
	padding:0
}

td:not([align]), th:not([align]) {
	text-align:left
}

.table {
	background-color: #fff;
	color: #363636
}

.table td, .table th {
	border: 1px solid #dbdbdb;
	border-width: 0 0 1px;
	padding: .5em .75em;
	vertical-align: top
}
```

## Trix Additions
The first component to add is a table button to the Trix editor. This can be done with a Stimulus controller, called `rich_text_table_controller.js`. This controller adds a button to the editor menu, and handles adding a table to the rich text editor.  

The `connect()` method adds a new “Table” button, which, when clicked, creates a new table. 

ActionText is designed to use secure attachments. This is a clever way to prevent leaking data, such as autocompleting files or usernames that you shouldn’t be able to access. This complicates our table setup, but isn’t going to stop our implementation. The `attachTable()` action on the controller generates a HTTP Post to the server to create the first table skeleton. When the server returns a table, `showTable()` attaches the table to the editor, and we can interact with it.

`rich_text_table_controller.js` code:
```js
import { Controller } from "stimulus"
import Trix from "trix"
import Rails from "@rails/ujs"

let lang = Trix.config.lang;

export default class extends Controller {

	connect() {
		Trix.config.lang.table = "Table"
		var tableButtonHTML = `<button type="button" class="trix-button trix-button--icon trix-button--icon-table" data-action="rich-text-table#attachTable" title="${lang.attachFiles}" tabindex="-1">${lang.table}</button>`
		var fileToolsElement = this.element.querySelector('[data-trix-button-group=file-tools]')
		fileToolsElement.insertAdjacentHTML("beforeend", tableButtonHTML)
	}

	attachTable(event) {
		Rails.ajax({
			url: `/tables`,
			type: 'post',
			success: this.insertTable.bind(this)
		})
	}

	insertTable(tableAttachment) {
		this.attachment = new Trix.Attachment(tableAttachment)
		this.element.querySelector('trix-editor').editor.insertAttachment(this.attachment)
		this.element.focus()
	}
}
```

Add the Stimulus controller to the `rich_text_area` tag in the Post form at `posts/_form.html.erb`:
```html
<div class="field" data-controller="rich-text-table">
  <%= form.label :body %>
  <%= form.rich_text_area :body %>
</div>
```

And add the SVG icon for the table button. This could go in `posts.scss`:
```css
trix-toolbar .trix-button--icon-table::before {
  background-image: url(data:image/svg+xml,%3Csvg%20width%3D%2224px%22%20height%3D%2224px%22%20viewBox%3D%220%200%2024%2024%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%3Cg%20stroke%3D%22none%22%20stroke-width%3D%221%22%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Crect%20stroke%3D%22%23000000%22%20x%3D%223%22%20y%3D%223%22%20width%3D%2218%22%20height%3D%2218%22%3E%3C%2Frect%3E%3Cpath%20d%3D%22M3%2C9%20L21%2C9%22%20stroke%3D%22%23000000%22%20stroke-linecap%3D%22square%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M3%2C15%20L21%2C15%22%20stroke%3D%22%23000000%22%20stroke-linecap%3D%22square%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M12%2C3%20L12%2C21%22%20stroke%3D%22%23000000%22%20stroke-linecap%3D%22square%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E);
}
```

## The Table model
The next section is going to move quickly, with a bunch of parts that need to be in place for everything to work together. In order to take advantage of the secure attachments, our table needs a model behind it. Using ActiveRecord is the most conventional way to design the Table.

The model `Table` that contains the number of rows and the number of columns. The data inside each cell is stored in a JSON blob, indexed by combining the row and column index for each cell, ie: `'0-1'`, `'3-2'`, or`'100-99'`. This sparse matrix saves space when there are empty cells, and, more importantly, gives the table complete flexibility as rows and columns are added.

Next, a Rails controller is needed to support creating a new table, supporting editing updates. 

Third, the `Table` model needs a HTML fragment for the editor view and a HTML fragment for the published view. 

### Table ActiveRecord
Create the ActiveRecord model: 
```bash
rails g model table columns:integer rows:integer data:json
```

Then set some defaults in the migration file:
```ruby
class CreateTables < ActiveRecord::Migration[6.0]
  def change
	create_table :tables do |t|
	  t.integer :columns, default: 1
	  t.integer :rows, default: 1
	  t.json :data, default: {}

	  t.timestamps
	end
  end
end
```
Open `table.rb` and add some extra modules that will make `Table` attachable, and whitelist the table tags in ActionText :
```ruby
ActionText::ContentHelper.allowed_tags += ['table', 'tr', 'td']

class Table < ApplicationRecord
  include GlobalID::Identification
  include ActionText::Attachable

  def to_trix_content_attachment_partial_path
	"tables/editor"
  end
end

```
_Make sure you restart your server after adding this file. The ActionText sanitizer is a singleton and needs to be reconfigured with the new allowed tags. Restarting your development server is good enough._

### Table Controller
Create a `tables_controller.rb` and add the `show`, `create`, and `update` methods. You can add the following in `routes.rb`:
```ruby
resources :tables, only: [:show, :create, :update]
```

Then create the controller, `tables_controller.rb`:
```ruby
class TablesController < ApplicationController
  def show
	@table = Table.find params[:id]
	render json: {
		sgid: @table.attachable_sgid,
		content: render_to_string(partial: "tables/editor", locals: { table: @table }, formats: [:html])
	}
  end

  def create
	@table = Table.create
	render json: {
		sgid: @table.attachable_sgid,
		content: render_to_string(partial: "tables/editor", locals: { table: @table }, formats: [:html])
	}
  end
  
  def update
	@table = ActionText::Attachable.from_attachable_sgid params[:id]
	if params["method"] == "addRow"
	  @table.rows += 1
	elsif params["method"] == "addColumn"
	  @table.columns += 1
	elsif params["method"] == "updateCell"
	  @table.data[params['cell']] = params['value']
	end
	@table.save
	render json: {
		sgid: @table.attachable_sgid,
		content: render_to_string(partial: "tables/editor", locals: { table: @table }, formats: [:html])
	}
  end
end
```


