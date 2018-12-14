from flask import Flask, render_template, request, jsonify
from database import *
import json

mapdb = database()

app = Flask(__name__)
@app.route("/")
def main():
    return render_template('index.html')

@app.route("/search=<string:text>")
def search(text):
    result = mapdb.search_node(str(text))
    return jsonify(result)

@app.route("/building=<text>")
def levels(text):
    result = mapdb.getLevels(text)
    return jsonify(result)

@app.route("/autocomplete=<text>")
def getautocomplete(text):
    result = mapdb.autocompleteItems()
    return jsonify(result)