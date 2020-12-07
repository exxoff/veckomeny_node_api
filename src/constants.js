module.exports = Object.freeze({
  // ERROR MESSAGES
  E_NOTFOUND: "E_NOTFOUND",
  E_NOTFOUND_MSG: "Nothing was found",
  E_COMMIT: "E_COMMIT",
  E_COMMIT_MSG: "Error committing transaction",
  E_ID_NAN: "E_IDNAN",
  E_ID_NAN_MSG: "ID is not a number",
  E_NAME_REQ: "E_NAMEREQ",
  E_NAME_REQ_MSG: "Name is required",
  E_NOTUPDATED: "E_NOTUPDATED",
  E_NOTUPDATED_MSG: "The post was not updated",
  E_DBERROR: "E_DBERROR",
  E_DBERROR_MSG: "Database error",
  E_INFOMISSING: "E_INFOMISSING",
  E_INFOMISSING_MSG: "Vital information is missing",
  E_NOTDATE: "E_NOTDATE",
  E_NOTDATE_MSG: "Not a valid date",
  E_INVALIDDATA: "E_INVALIDDATA",
  E_INVALIDDATA_MSG: "Data is not valid",
  E_USER_AUTH_FAILED: "E_USER_AUTH_FAILED",
  E_USER_AUTH_FAILED_MSG: "Authentication failed",
  E_USER_NOT_FOUND: "E_USER_NOT_FOUND",
  E_USER_NOT_FOUND_MSG: "User not found",

  // INFO MESSAGES
  I_SUCCESS: "I_SUCCESS",
  I_SUCCESS_MSG: "OK",
  I_NOT_ACCEPTING_NEW_USERS: "I_NOT_ACCEPTING_NEW_USERS",
  I_NOT_ACCEPTING_NEW_USERS_MSG:
    "This service currently doesn't accept user registrations",

  // DB CONSTANTS
  MENU_TABLE: "menus",
  RECIPE_TABLE: "recipes",
  CATEGORY_TABLE: "categories",
  JOIN_TABLE: "category_recipe",
  USERS_TABLE: "users",
  KEYS_TABLE: "apikeys",
  MENU_RECIPE_XREF_TABLE: "menu_recipe",
});
