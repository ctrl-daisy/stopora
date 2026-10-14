from flask import Flask

app = Flask(__name__, static_folder="../frontend", static_url_path="")

@app.route("/")
def home():
    return app.send_static_file("index.html")

if __name__ == "__main__":
    app.run(debug=True)