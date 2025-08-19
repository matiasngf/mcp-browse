import express from 'express'
import cors from 'cors'
import { Request, Response } from 'express'

export function createHttpMockServer() {
  const app = express()

  // Middleware
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(express.text())

  // Helper to extract request info
  const getRequestInfo = (req: Request) => ({
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    method: req.method,
    headers: req.headers,
    origin: req.ip,
    args: req.query,
  })

  // GET endpoint
  app.get('/get', (req: Request, res: Response) => {
    res.json({
      ...getRequestInfo(req),
      data: '',
      files: {},
      form: {},
      json: null,
    })
  })

  // POST endpoint
  app.post('/post', (req: Request, res: Response) => {
    const response: any = {
      ...getRequestInfo(req),
      data: '',
      files: {},
      form: {},
      json: null,
    }

    // Handle different content types
    if (req.is('application/json')) {
      response.json = req.body
      response.data = JSON.stringify(req.body)
    } else if (req.is('application/x-www-form-urlencoded')) {
      response.form = req.body
      response.data = new URLSearchParams(req.body).toString()
    } else if (req.is('text/*')) {
      response.data = req.body
    }

    res.json(response)
  })

  // PUT endpoint
  app.put('/put', (req: Request, res: Response) => {
    const response: any = {
      ...getRequestInfo(req),
      data: '',
      files: {},
      form: {},
      json: null,
    }

    if (req.is('application/json')) {
      response.json = req.body
      response.data = JSON.stringify(req.body)
    }

    res.json(response)
  })

  // DELETE endpoint
  app.delete('/delete', (req: Request, res: Response) => {
    res.json({
      ...getRequestInfo(req),
      data: '',
      files: {},
      form: {},
      json: null,
    })
  })

  // PATCH endpoint
  app.patch('/patch', (req: Request, res: Response) => {
    const response: any = {
      ...getRequestInfo(req),
      data: '',
      files: {},
      form: {},
      json: null,
    }

    if (req.is('application/json')) {
      response.json = req.body
      response.data = JSON.stringify(req.body)
    }

    res.json(response)
  })

  // Headers endpoint
  app.get('/headers', (req: Request, res: Response) => {
    res.json({
      headers: req.headers
    })
  })

  // Status code endpoint
  app.get('/status/:code', (req: Request, res: Response) => {
    const code = parseInt(req.params.code)
    res.status(code).json({
      message: `Status code: ${code}`
    })
  })

  // JSON endpoint
  app.get('/json', (req: Request, res: Response) => {
    res.json({
      slideshow: {
        author: "Yours Truly",
        date: "date of publication",
        slides: [
          {
            title: "Wake up to WonderWidgets!",
            type: "all"
          },
          {
            items: [
              "Why <em>WonderWidgets</em> are great",
              "Who <em>buys</em> WonderWidgets"
            ],
            title: "Overview",
            type: "all"
          }
        ],
        title: "Sample Slide Show"
      }
    })
  })

  // Redirect endpoint
  app.get('/redirect/:n', (req: Request, res: Response) => {
    const n = parseInt(req.params.n)
    if (n > 1) {
      res.redirect(`/redirect/${n - 1}`)
    } else {
      res.redirect('/get')
    }
  })

  return app
}
