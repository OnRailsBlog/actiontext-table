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
