ActionText::ContentHelper.allowed_tags += ['table', 'tr', 'td']

class Table < ApplicationRecord
  include GlobalID::Identification
  include ActionText::Attachable

  def to_trix_content_attachment_partial_path
	"tables/editor"
  end
end