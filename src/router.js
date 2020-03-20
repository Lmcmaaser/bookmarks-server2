const express = require('express');
const uuid = require('uuid/v4');
const { isWebUri } = require('valid-url');
const xss = require('xss');
const logger = require('./logger');
const store = require('./store');
const router = express.Router();
const bodyParser = express.json();
const BookmarksService = require('./bookmarks-service');
const { getBookmarkValidationError } = require('./bookmark-validator')

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
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      });
      .catch(next)
  });

  // adds a bookmark
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const newBookmark = { title, url, description, rating };

    for (const field of ['title', 'url', 'rating']) {
      if (!newBookmark[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send({
          error: { message: `'${field}' is required` }
        });
      };
    };

    const error = getBookmarkValidationError(newBookmark);

    if (error) return res.status(400).send(error);

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    );
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created.`)
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${bookmark.id}`))
          .json(serializeBookmark(bookmark))
      });
      .catch(next);
    });
    //error handling
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send(`'rating' must be a number between 0 and 5`)
    };

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send(`'url' must be a valid URL`)
    };

    const newBookmark = { title, url, description, rating };

   BookmarksService.insertBookmark(
     req.app.get('db'),
     newBookmark
   );
     .then(bookmark => {
       logger.info(`Card with id: ${bookmark.bookmark_id} created.`)
       res
         .status(201)
         .location(`/bookmarks/${bookmark.bookmark_id}`)
         .json(serializeBookmark(bookmark))
     });
     .catch(next);
 });

router
 .route('/:bookmark_id');
 .all((req, res, next) => {
   const { bookmark_id } = req.params
   BookmarksService.getById(req.app.get('db'), bookmark_id)
     .then(bookmark => {
       if (!bookmark) {
         logger.error(`Bookmark with id: ${bookmark_id} not found.`)
         return res.status(404).json({
           error: { message: `Bookmark Not Found` }
         });
       };
       res.bookmark = bookmark
       next()
     });
     .catch(next);

 });

 .get((req, res) => {
   res.json(serializeBookmark(res.bookmark))
 });

 .delete((req, res, next) => {
   const { bookmark_id } = req.params
   BookmarksService.deleteBookmark(
     req.app.get('db'),
     bookmark_id
   );
     .then(numRowsAffected => {
       logger.info(`Card with id: ${bookmark_id} deleted.`)
       res.status(204).end()
     });
     .catch(next)
 });

 .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const bookmarkToUpdate = { title, url, description, rating };

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      logger.error(`Invalid update without required fields`);
      return res.status(400).json({
        error: {
          message: `Request body must content either 'title', 'url', 'description' or 'rating'`
        }
      });
    };

    const error = getBookmarkValidationError(bookmarkToUpdate);

    if (error) return res.status(400).send(error);

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.bookmark_id,
      bookmarkToUpdate
    );
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  });

module.exports = router
