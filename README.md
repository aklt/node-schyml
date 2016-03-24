# Schyml - generate json, images, data and api from YAML

If m.yml contains a model of data, the following commands will generate a
format of this data:

Usage:

    schyml html    m.yml [outFile] - Generate html from markdown comments in model.yml
    schyml json    m.yml [outFile] - Include $refs and show json of model
    schyml table   m.yml [outFile] - Show json used for uml and data templates
    schyml uml     m.yml [outFile] - Show plantuml object
    schyml png     m.yml [outFile] - Create an image of the model with plantuml
    schyml data    m.yml [outFile] - generate a random data object of model
    schyml data/js m.yml [outFile] - output a js function to generate data for model

