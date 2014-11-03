## Launch Fuseki

./fuseki-server --update --mem /sem

## Add N3 records

PUT http://localhost:3030/sem/data?default
with Content-Type: text/turtle
