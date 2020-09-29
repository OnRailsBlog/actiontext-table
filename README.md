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
