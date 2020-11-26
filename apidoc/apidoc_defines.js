/**
 * @apiDefine Pagination
 * @apiParam (Query String) {Number} [limit] Limit number of records returned
 * @apiParam (Query String) {Number} [offset] The number of records to skip
 */

/**
 * @apiDefine SingleEntityHeader
 *
 * @apiSuccess {String} code Success code
 * @apiSuccess {String} msg Success message
 * @apiSuccess {Object} data Data
 *
 */

/**
 * @apiDefine MultiEntityHeader
 *
 * @apiSuccess {String} code Success code
 * @apiSuccess {String} msg Success message
 * @apiSuccess {Object[]} data Data
 *
 */

/**
 * @apiDefine EntityTimeStamps
 * @apiSuccess {Timestamp} data.created_at Record creation date
 * @apiSuccess {Timestamp} data.updated_at Last record update date
 */

/**
 * @apiDefine Error
 * @apiError {String} code Error code
 * @apiError {String} msg Error message
 * @apiError {Object} error More info on error
 */

/**
 * @apiDefine RecipeEntity
 * @apiSuccess {Number} data.id ID
 * @apiSuccess {String} data.name Name of the recipe
 * @apiSuccess {String} data.link URL to the recipe
 * @apiSuccess {String} data.comment Recipe comment
 * @apiSuccess {Boolean} data.deleted Specifies if recipe is archived
 */

/**
 * @apiDefine CategoryEntity
 * @apiSuccess {Number} data.id ID
 * @apiSuccess {String} data.name Name of the category
 */

/**
 * @apiDefine MenuEntity
 * @apiSuccess {Number} data.id ID
 * @apiSuccess {Date} data.date Menu date
 * @apiSuccess {Number} data.recipe_id ID of the dish served
 * @apiSuccess {String} data.comment Menu comment
 */

/**
 * @apiDefine RecipeCollectionExample
 * @apiSuccessExample Example:
 * {
 * "code": "I_SUCCESS",
 *   "msg": "OK",
 *   "data":
 *   [
 *      {
 *          "id": 11,
 *
 *          "created_at": "2020-03-06T10:07:46.000Z",
 *          "updated_at": "2020-03-06T10:07:46.000Z",
 *          "name": "Chicken caserole with mushrooms",
 *          "link": "",
 *          "comment": ""
 *      },
 *      {
 *          "id": 35,
 *          "created_at": "2020-03-06T10:07:46.000Z",
 *          "updated_at": "2020-03-06T10:07:46.000Z",
 *          "name": "Oven baked salmon with chili and lime with a noodle salad",
 *          "link": "http://www.coop.se/Recept--mat/Recept/c/chili--och-limelax-i-ugn-med-nudelsallad/",
 *          "comment": "Don't rinse the noodles."
 *      }
 *  ]
 * }
 */

/**
 * @apiDefine RecipeExamle
 *{
 *    "code": "I_SUCCESS",
 *    "msg": "OK",
 *    "data": {
 *        "id": 101,
 *        "created_at": "2020-03-06T10:07:46.000Z",
 *        "updated_at": "2020-03-06T10:07:46.000Z",
 *        "name": "Bell pepper soup with grilled Västerbottens cheese toast",
 *        "link": "http://www.ica.se/recept/paprikasoppa-med-vasterbottenstoast-715932/",
 *        "comment": "",
 *        "deleted": false
 *    }
 *}
 */

/**
 * @apiDefine CategoryCollectionExample
 * {
 *  "code": "I_SUCCESS",
 *  "msg": "OK",
 *  "data": [
 *      {
 *          "id": 1,
 *          "created_at": "2020-03-06T10:07:45.000Z",
 *          "updated_at": "2020-03-06T10:07:45.000Z",
 *          "name": "Huvudrätt"
 *      },
 *      {
 *          "id": 2,
 *          "created_at": "2020-03-06T10:07:45.000Z",
 *          "updated_at": "2020-03-06T10:07:45.000Z",
 *          "name": "Förrätt"
 *      }
 *    ]
 *  }
 */
