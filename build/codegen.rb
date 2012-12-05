require 'codegen/lib/markdown_parser'
require 'codegen/lib/component'
require 'codegen/lib/java/tld'

namespace :generate do

    namespace :java do

        task :tld do

            generator = CodeGen::Java::TLD::Generator.new('wrappers/java/kendo-taglib/src/main/resources/META-INF/taglib.tld')

            components = CodeGen::MarkdownParser.all

            components.each do |component|

                metadata = "build/codegen/#{component.name.downcase}.yml"

                if File.exists?(metadata)
                    yaml = YAML.load(File.read(metadata))

                    component.import(yaml)
                end

                generator.component(component)

            end

            generator.sync

        end
    end

end
