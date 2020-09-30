import { Controller } from "stimulus"
import Trix from "trix"
import Rails from "@rails/ujs"

const MAX_PARENT_SEARCH_DEPTH = 5;

export default class extends Controller {

	addRow(event) {
		Rails.ajax({
			url: `/tables/${this.getID()}`,
			data: 'method=addRow' ,
			type: 'patch',
			success: this.attachTable.bind(this)
		})
	}

	addColumn(event) {
		Rails.ajax({
			url: `/tables/${this.getID()}`,
			data: 'method=addColumn' ,
			type: 'patch',
			success: this.attachTable.bind(this)
		})
	}

	updateCell(event) {
		Rails.ajax({
			url: `/tables/${this.getID()}`,
			data: `method=updateCell&cell=${encodeURIComponent(event.target.dataset.key)}&value=${encodeURIComponent(event.target.value)}` ,
			type: 'patch'
		})
	}

	getID() {
		return this.data.get('id');
	}

	attachTable(tableAttachment) {
		let attachment = new Trix.Attachment(tableAttachment)
		var parent = this.element.parentNode;
		var editorNode = null;
		for (let i = 0; i < MAX_PARENT_SEARCH_DEPTH; i++) {
			editorNode = parent.querySelector('trix-editor');
			if (editorNode != null) {
				i = MAX_PARENT_SEARCH_DEPTH;
			} else {
				parent = parent.parentNode;
			}
		}
		editorNode.editor.insertAttachment(attachment)
	}
} 