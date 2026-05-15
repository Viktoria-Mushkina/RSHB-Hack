from pydantic import BaseModel
from typing import List, Optional

class Product(BaseModel):
    id: int
    name: str
    category: str
    cuisine_types: List[str]
    seasons: List[str]
    image_url: Optional[str] = None

class Farmer(BaseModel):
    id: int
    name: str
    product_name: str
    category: str
    region: str
    description: Optional[str] = None
    website_url: Optional[str] = None
    product_url: Optional[str] = None
    organization_id: Optional[str] = None
    product_id: Optional[int] = None

class ProductWithFarmers(BaseModel):
    product: Product
    available_farmers: List[Farmer]
    season_label: str = ""
    season_hint: str = ""
    related_dishes: List[str] = []
    menu_dish_count: int = 0

class SeasonChangeItem(BaseModel):
    dish_name: str
    subtitle: str
    days_until: int
    ingredients: List[str] = []

class SeasonalChangesResponse(BaseModel):
    entering: List[SeasonChangeItem]
    exiting: List[SeasonChangeItem]

class SupplierPreview(BaseModel):
    id: int
    name: str
    product_line: str
    region: str
    badge: str = ""
    website_url: Optional[str] = None

class MenuDishIngredient(BaseModel):
    product_id: int
    name: str
    category: str = ""
    seasons: List[str] = []
    image_url: Optional[str] = None
    season_label: str = ""
    season_variant: str = "out"

class MenuDish(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str] = None
    status: str = "in_menu"
    seasonality_percent: int = 0
    image_url: Optional[str] = None
    ingredients: List[MenuDishIngredient] = []

class UploadResponse(BaseModel):
    success: bool
    filename: str = ""
    products_count: int = 0
    products_by_category: dict = {}
    products: List[Product] = []
    products_with_farmers: List[ProductWithFarmers] = []
    message: Optional[str] = None
    seasonality_percent: int = 0
    top_suppliers: List[SupplierPreview] = []
    menu_season_entering: List[SeasonChangeItem] = []
    menu_season_exiting: List[SeasonChangeItem] = []
    menu_dishes: List[MenuDish] = []
