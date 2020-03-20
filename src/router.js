const express = require('express')
const uuid = require('uuid/v4')
const { isWebUri } = require('valid-url')
const xss = require('xss')
const logger = require('./logger')
const store = require('./store')
const router = express.Router()
const bodyParser = express.json()
const BookmarksService = require('./bookmarks-service')

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});

// returns list of bookmarks
//GET and POST
router
  .route('/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      });
      .catch(next)
  });

  // adds a bookmark
  .post(bodyParser, (req, res) => {
    for (const field of ['title', 'url', 'rating']) {
      console.log(req.body)
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`'${field}' is required`)
      };
    };
    const { title, url, description, rating } = req.body

    //error handling
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send(`'rating' must be a number between 0 and 5`)
    };

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send(`'url' must be a valid URL`)
    };

    const newBookmark = { title, url, description, rating }

   BookmarksService.insertBookmark(
     req.app.get('db'),
     newBookmark
   )
     .then(bookmark => {
       logger.info(`Card with id: ${bookmark.id} created.`)
       res
         .status(201)
         .location(`/bookmarks/${bookmark.id}`)
         .json(serializeBookmark(bookmark))
     })
     .catch(next)
 })

router
 .route('/bookmarks/:id')
 .all((req, res, next) => {
   const { id } = req.params
   BookmarksService.getById(req.app.get('db'), id)
     .then(bookmark => {
       if (!bookmark) {
         logger.error(`Bookmark with id: ${id} not found.`)
         return res.status(404).json({
           error: { message: `Bookmark Not Found` }
         })
       }
       res.bookmark = bookmark
       next()
     })
     .catch(next)

 })
 .get((req, res) => {
   res.json(serializeBookmark(res.bookmark))
 })
 .delete((req, res, next) => {
   // TODO: update to use db
   const { id } = req.params
   BookmarksService.deleteBookmark(
     req.app.get('db'),
     id
   )
     .then(numRowsAffected => {
       logger.info(`Card with id: ${id} deleted.`)
       res.status(204).end()
     })
     .catch(next)
 })

module.exports = router
