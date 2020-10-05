require "application_system_test_case"

class PostTablesTest < ApplicationSystemTestCase
  test "Test table creation" do
    visit new_post_url
  
    click_on "Attach Table"
    # Test for table fields
    assert_text "Add Row"
    assert_text "Add Column"
    assert page.has_selector?('table tbody tr td input')
    assert page.has_selector?('input[data-key="0-0"]')
    assert page.has_selector?('input[data-key="0-1"]') == false
    assert page.has_selector?('input[data-key="1-0"]') == false
    click_on "Add Column"
    assert page.has_selector?('input[data-key="0-1"]')
    click_on "Add Row"
    assert page.has_selector?('input[data-key="1-0"]')
    fill_in "1-0", with: "Test entry"
    click_on "Create Post"
    assert_text "Test entry"
  end
end
