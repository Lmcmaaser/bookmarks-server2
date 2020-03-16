const express = require('express')
const uuid = require('uuid/v4')
const { isWebUri } = require('valid-url')
const logger = require('./logger')
const store = require('./store')
const router = express.Router()
const bodyParser = express.json()

// returns list of bookmarks
//GET and POST
router
  .route('/bookmarks')
  .get((req, res) => {
    res.json(store.bookmarks)
  })
  // adds a bookmark
  .post(bodyParser, (req, res) => {
    for (const field of ['title', 'url', 'rating']) {
      console.log(req.body)
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`'${field}' is required`)
      }
    }
    const { title, url, description, rating } = req.body
    //error handling
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`)
      return res.status(400).send(`'rating' must be a number between 0 and 5`)
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send(`'url' must be a valid URL`)
    }

    const bookmark = { id: uuid(), title, url, description, rating }

    store.bookmarks.push(bookmark)

    logger.info(`Bookmark with id: ${bookmark.id} created`)
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
      .json(bookmark)
  })

//GET and DELETE
// returns a single bookmark with the given ID
router
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params

    const bookmark = store.bookmarks.find(c => c.id == id)
  // make sure we found a bookmark
    if (!bookmark) {
      logger.error(`Bookmark with id: ${id} not found.`)
      return res
        .status(404)
        .send('Bookmark Not Found')
    }

    res.json(bookmark)
  })
  .delete((req, res) => {
    const { id } = req.params

    const bookmarkIndex = store.bookmarks.findIndex(b => b.id === id)

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id: ${id} not found.`)
      return res
        .status(404)
        .send('Bookmark Not Found')
    }

    store.bookmarks.splice(bookmarkIndex, 1)

    logger.info(`Bookmark with id: ${id} deleted.`)
    res
      .status(204)
      .end()
  })

module.exports = router
