# Frontend ↔ backend agreement

This is the proposed contract for the team to implement in the existing `server/` scaffold. It documents the frontend's actual requests; it does not mean these backend routes exist yet. Change the client and this agreement together if the backend team chooses different paths or shapes.

## Shared behavior

- Base URL: `VITE_API_URL`, an origin such as `http://localhost:3000`, without `/api` appended.
- JSON request/response bodies; errors use `{ "error": "A message suitable for the user" }`.
- Private requests send `Authorization: Bearer <token>` automatically.
- Lists return arrays directly, not `{ data: [...] }` envelopes.
- Documents use string `_id` values. Recipe IDs are strings.
- DELETE succeeds with `204 No Content`; no JSON body is required.
- The server gets the owner from the verified JWT and includes `userId` in every database query. The client never chooses an owner or sends `userId`.
- Missing/invalid/expired JWT: HTTP 401. The API client dispatches `auth:expired`, clears the local session, and redirects private views to login.
- Invalid credentials at login: HTTP 401 with a generic message. Login requests do not expire another session.
- Invalid input: HTTP 400. Duplicate email/ingredient: HTTP 409. A document absent or owned by another user: HTTP 404.
- CORS must accept `CLIENT_ORIGIN`, the `Authorization` and `Content-Type` headers, and GET/POST/PATCH/DELETE/OPTIONS methods.

## Authentication

| Method | Path | Request | Successful response |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | `{ name, email, password }` | 201 `{ token, user: { _id, name, email } }` |
| POST | `/api/auth/login` | `{ email, password }` | 200 `{ token, user: { _id, name, email } }` |

Example signup:

```json
{ "name": "Jovani", "email": "jovani@example.com", "password": "an-example-only" }
```

The frontend requires a trimmed name of 2+ characters, a valid email, and a signup password of at least 8 characters. Validate these again on the server. Hash passwords with bcrypt; never return or store the plaintext password in the browser. Return a signed JWT and public user details from both routes, matching Chapter 19's `/signup` and `/login` and Chapter 20's auth provider.

The frontend stores the JWT and user profile in `fridgechef.token` and `fridgechef.user` in localStorage, following the classroom approach. Logout clears both and unmounts all private kitchen state. A saved token only controls the visible client route; the API remains the authority on identity and access. No JWT secret belongs in a `VITE_` value.

## Pantry

| Method | Path | Request | Successful response |
| --- | --- | --- | --- |
| GET | `/api/pantry` | — | 200 `PantryItem[]` |
| POST | `/api/pantry` | `{ ingredientName, quantity }` | 201 `PantryItem` |
| PATCH | `/api/pantry/:id` | `{ ingredientName, quantity }` | 200 `PantryItem` |
| DELETE | `/api/pantry/:id` | — | 204 |

```json
{ "_id": "a-mongodb-id", "ingredientName": "Tomatoes", "quantity": "4 whole" }
```

`ingredientName` is a required trimmed string (max 80), `quantity` is a required display string (max 50), e.g. `500 g`, `2 bulbs`. The client checks duplicates on add; the server should enforce user-specific, normalized uniqueness as well. Schema ownership: `userId: ObjectId → Users`.

## Favorites

| Method | Path | Request | Successful response |
| --- | --- | --- | --- |
| GET | `/api/favorites` | — | 200 `Favorite[]` |
| POST | `/api/favorites` | `{ recipeId, recipeName, recipeImage }` | 201 `Favorite` |
| DELETE | `/api/favorites/:id` | — | 204 |

```json
{ "_id": "a-mongodb-id", "recipeId": "52771", "recipeName": "Spicy Arrabiata Penne", "recipeImage": "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg" }
```

`recipeImage` is optional metadata; recipe details are loaded by recipe ID. Enforce uniqueness on `(userId, recipeId)`. The DELETE ID is the favorite document `_id`, not the recipe ID.

## Shopping items

| Method | Path | Request | Successful response |
| --- | --- | --- | --- |
| GET | `/api/shopping` | — | 200 `ShoppingItem[]` |
| POST | `/api/shopping` | `{ ingredientName, checked: false }` | 201 `ShoppingItem` |
| PATCH | `/api/shopping/:id` | `{ checked: boolean }` | 200 `ShoppingItem` |
| DELETE | `/api/shopping/:id` | — | 204 |

```json
{ "_id": "a-mongodb-id", "ingredientName": "Chilli flakes", "checked": false }
```

`ingredientName` is a required string (max 80). `checked` must be a boolean. Enforce uniqueness on normalized ingredient name per owner. “Add missing” deduplicates pantry gaps against the existing shopping list and issues sequential POSTs. If a request fails, earlier successful additions remain; the UI shows the error and the refreshed list supports retry. The client does not merge or calculate quantities. “Clear picked up” deletes the checked documents sequentially.

## Recipe provider

Public recipe requests currently go directly to `VITE_MEALDB_URL` through the shared JSON request client. They **never receive the private bearer token**. The [official V1 API](https://www.themealdb.com/api.php) supplies:

| Purpose | Path |
| --- | --- |
| Name search / discovery | `/search.php?s=<name>` |
| Full recipe | `/lookup.php?i=<id>` |
| Single ingredient candidates | `/filter.php?i=<ingredient>` |

The service normalizes the 20 `strIngredientN`/`strMeasureN` slots in each full recipe. Pantry recommendations collect candidates for up to five unique pantry names, keep at most 24 distinct candidates, fetch full details in batches of six, then rank by the percentage of ingredient names present. It is a bounded candidate selection, not an exhaustive search of the entire database. Typed name searches rank within the returned name results when pantry matches are enabled. Category chips filter the loaded result set.

If the backend team proxies TheMealDB later, keep this behavior in `client/src/api/recipes.js` and point recipe calls at those agreed public endpoints. The screens should not need changes.

## Two-user handoff check

1. Start the actual API and frontend; exit demo mode.
2. Sign up as Alice. Add/edit a pantry ingredient, save a recipe, generate missing shopping items, and refresh each page.
3. Log out. Sign up as Bob. Confirm Alice's pantry, favorites, and shopping list are absent.
4. Attempt to PATCH/DELETE an Alice document using Bob's token. Expect 404 and no changes.
5. Use an expired/invalid token. Expect a 401, cleared local session, and login with the session-expiry message.
6. Repeat using the deployed frontend and API URLs with production CORS configuration.
