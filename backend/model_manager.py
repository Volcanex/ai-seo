import os
import json
import uuid
from typing import Dict, List, Optional
from models import Model, UrlData
from user_manager import get_user_model_path
import types

def create_model(user_id: str, model_name: str, base_url: str, processed_data: List[Dict]) -> Model:
    model_id = str(uuid.uuid4())
    model = Model(
        id=model_id,
        name=model_name,
        user_id=user_id,
        base_url=base_url,
        urls=[UrlData(**data) for data in processed_data]
    )
    
    model_path = get_user_model_path(user_id, model_id)
    with open(model_path, 'w') as f:
        f.write(model.to_json())
    
    return model

def get_model(user_id: str, model_id: str) -> Optional[Model]:
    model_path = get_user_model_path(user_id, model_id)
    if not os.path.exists(model_path):
        return None
    
    with open(model_path, 'r') as f:
        return Model.from_json(f.read())

def list_models(user_id: str) -> List[Model]:
    user_models_dir = os.path.join(get_user_model_path(user_id), '')
    models = []
    
    for filename in os.listdir(user_models_dir):
        if filename.endswith('.json'):
            model_path = os.path.join(user_models_dir, filename)
            with open(model_path, 'r') as f:
                models.append(Model.from_json(f.read()))
    
    return models

def delete_model(user_id: str, model_id: str) -> bool:
    model_path = get_user_model_path(user_id, model_id)
    if os.path.exists(model_path):
        os.remove(model_path)
        return True
    return False