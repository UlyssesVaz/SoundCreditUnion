from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Product
from app.schemas import ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse])
async def get_products(
    product_type: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all active products from Sound CU's catalog.
    
    - **product_type**: Optional filter (loan, credit_card, savings_account, checking_account)
    """
    query = select(Product).where(Product.is_active == True)
    
    if product_type:
        query = query.where(Product.type == product_type)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return [ProductResponse.model_validate(p) for p in products]
