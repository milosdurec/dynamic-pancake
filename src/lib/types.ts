export interface Ingredient {
  name: string;
  amount: string;
  note?: string;
}

export interface PhotoAnalysisResponse {
  dishName: string;
  ingredients: Ingredient[];
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface NutrientRow {
  nutrient: string;
  per100g: string;
  perServing: string;
}

export interface NutritionRequest {
  dishName: string;
  ingredients: Ingredient[];
}

export interface NutritionResponse {
  dishName: string;
  servingSize: string;
  table: NutrientRow[];
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface RecipeResponse {
  dishName: string;
  source: string;
  rating?: string;
  prepTime?: string;
  cookTime?: string;
  servings: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

export interface ShoppingItem {
  name: string;
  amount: string;
  unit: string;
  category: string;
}

export interface ShoppingListResponse {
  dishName: string;
  people: number;
  items: ShoppingItem[];
  estimatedCost?: string;
}

export interface LocationResponse {
  restaurantName: string;
  address?: string;
  rating?: string;
  priceRange?: string;
  specialties?: string[];
  assessment: string;
  pros: string[];
  cons: string[];
  recommendation: string;
}

export interface ReviewsResponse {
  googleReview: string;
  tripAdvisorReview: string;
  starRating: number;
}

export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface AppState {
  currentStep: WorkflowStep;
  photoAnalysis?: PhotoAnalysisResponse;
  nutrition?: NutritionResponse;
  recipe?: RecipeResponse;
  shoppingList?: ShoppingListResponse;
  location?: LocationResponse;
  reviews?: ReviewsResponse;
}

export interface ApiError {
  error: string;
  details?: string;
}
