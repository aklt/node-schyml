# Schyf - generate json, images, data and api from YAML


Usage:

    schyf doc  m.yml        - Generate markdown from comments in model.yml
    schyf json m.yml        - Include $refs and show json of model
    schyf json/table m.yml  - Show json used for uml and data templates
    schyf uml m.yml         - Show plantuml object
    schyf uml/png           - Create an image of the model with plantuml
    schyf data m.yml        - generate a random data object of model
    schyf data/js m.yml     - output a js function to generate data for model

