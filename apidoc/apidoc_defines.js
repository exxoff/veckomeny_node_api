/**
 * @apiDefine Pagination
 * @apiParam (Query String) {Number} [limit] Limit number of records returned
 * @apiParam (Query String) {Number} [offset] The number of records to skip
 */

/**
 * @apiDefine SingleEntityHeader
 *
 *
 */

/**
 * @apiDefine MultiEntityHeader
 *
 *
 */

/**
 * @apiDefine EntityTimeStamps
 * @apiSuccess {Timestamp} created_at Record creation date
 * @apiSuccess {Timestamp} updated_at Last record update date
 */

/**
 * @apiDefine Error
 * @apiError {String} code Error code
 * @apiError {String} msg Error message
 * @apiError {Object} error More info on error
 */

/**
 * @apiDefine RecipeEntity
 * @apiSuccess {Number} id ID
 * @apiSuccess {String} name Name of the recipe
 * @apiSuccess {String} link URL to the recipe
 * @apiSuccess {String} comment Recipe comment
 * @apiSuccess {Boolean} deleted Specifies if recipe is archived
 */

/**
 * @apiDefine CategoryEntity
 * @apiSuccess {Number} id ID
 * @apiSuccess {String} name Name of the category
 */

/**
 * @apiDefine MenuEntity
 * @apiSuccess {Number} id ID
 * @apiSuccess {Date} date Menu date
 * @apiSuccess {Number} recipe_id ID of the dish served
 * @apiSuccess {String} comment Menu comment
 */

/**
 * @apiDefine RecipeCollectionExample
 * @apiSuccessExample Example:
 *
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
 */

/**
 * @apiDefine RecipeExamle
 *{
 *        "id": 101,
 *        "created_at": "2020-03-06T10:07:46.000Z",
 *        "updated_at": "2020-03-06T10:07:46.000Z",
 *        "name": "Bell pepper soup with grilled Västerbottens cheese toast",
 *        "link": "http://www.ica.se/recept/paprikasoppa-med-vasterbottenstoast-715932/",
 *        "comment": "",
 *        "deleted": false
 *}
 */

/**
 * @apiDefine CategoryCollectionExample
 * [
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
 *   ]
 */
