from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .ghgi.ghgi import parser
from typing import Any, Optional, Dict, List
from pydantic import BaseModel

from sqlalchemy.orm import Session
from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.sexytofu.org",
                   "https://dev.sexytofu.org",
                   "https://qa.sexytofu.org",
                   "http://35.162.13.216:5000",
                   "http://localhost:1234"],
    allow_methods=["*"]
)

# Type aliases
Name = str
Quantity = float
Unit = str
Product = Dict[str, Any]


class SearchInput(BaseModel):
    groceryList: list


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "Say hi to Sexy Tofu!"}


@app.get("/parse/")
async def parse(query: str) -> Product:
    parsed_response = parser.amounts(query, default=False)
    return parsed_response


@app.get("/recommendations/", response_model=List[schemas.Recommendation])
async def get_all_recommendations(db: Session = Depends(get_db)) -> List[schemas.Recommendation]:
    return crud.get_all_recos(db)


@app.get("/recommendations/{food_alias}/", response_model=List[schemas.Recommendation])
async def get_recommendations_by_food_alias(food_alias: str,
                                            skip: Optional[int] = 0,
                                            limit: Optional[int] = 10,
                                            db: Session = Depends(get_db)) -> List[schemas.Recommendation]:
    food = crud.get_food_by_alias(db=db, alias=food_alias)
    if food is None:
        raise HTTPException(status_code=404, detail=f"{food_alias} not found")
    recos = crud.get_recos_by_food_id(db=db, food_id=food.id, skip=skip, limit=limit)
    return recos


@app.post("/recommendations/", response_model=List[schemas.Recommendation])
async def add_recommendation(reco: schemas.RecoCreate, db: Session = Depends(get_db)) -> List[str]:
    new_reco = crud.create_recommendation(db, reco)
    all_recos = crud.get_all_recos(db)
    return all_recos


@app.get("/food-aliases/", response_model=List[schemas.FoodNameWithAlias])
async def get_all_food_aliases(db: Session = Depends(get_db)) -> List[schemas.FoodNameWithAlias]:
    food = {}
    for pair in crud.get_all_food_aliases(db):
        food[pair.name] = food.setdefault(pair.name, '') + pair.alias + ', '
    return [schemas.FoodNameWithAlias(name=k, aliases=v) for k, v in food.items()]


@app.get("/food-name/{alias}/", response_model=List[schemas.FoodNameWithAlias])
async def get_food_name_by_alias(alias: str,
                                 db: Session = Depends(get_db)) -> List[schemas.Food]:
    return crud.get_food_by_alias(db=db, alias=alias)


@app.delete("/recommendations/{id}/", response_model=List[schemas.Recommendation])
async def delete_recommendation(id: int,
                                db: Session = Depends(get_db)) -> List[schemas.Recommendation]:
    crud.delete_recommendation(db=db, reco_id=id)
    return crud.get_all_recos(db)


@app.get("/land_use/{food_alias}/", response_model=schemas.LandUse)
async def get_land_use_by_food_alias(food_alias: str,
                                     db: Session = Depends(get_db)) -> schemas.LandUse:
    food = crud.get_food_by_alias(db=db, alias=food_alias)
    if food is None:
        raise HTTPException(status_code=404, detail=f"{food_alias} not found")
    return crud.get_land_use_by_food_id(db=db, food_id=food.id)


@app.get("/water_use/{food_alias}/", response_model=schemas.WaterUse)
async def get_water_use_by_food_alias(food_alias: str,
                                      db: Session = Depends(get_db)) -> schemas.WaterUse:
    food = crud.get_food_by_alias(db=db, alias=food_alias)
    if food is None:
        raise HTTPException(status_code=404, detail=f"{food_alias} not found")
    return crud.get_water_use_by_food_id(db=db, food_id=food.id)
