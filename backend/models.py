from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.String(128), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    models = db.relationship('Model', backref='user', lazy=True)
    csvs = db.relationship('CSV', backref='user', lazy=True)


class Model(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    base_url = db.Column(db.String(200))
    url_column = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.String(128), db.ForeignKey(
        'user.id'), nullable=False)
    data = db.Column(db.JSON, nullable=False)
    last_scraped_id = db.Column(db.Integer, default=0)


class CSV(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.String(128), db.ForeignKey(
        'user.id'), nullable=False)
