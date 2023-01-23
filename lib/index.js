const spawn = require('process').spawn
const { prng } = require('crypto')
const path = require('path')

const Canvas = require('canvas')
const klaw = require('klaw')
const fs = require('fs-extra')


const api = {
  uuid: () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
    .replace(/[018]/g, b =>
      (((b ^ prng(1)[0]) % 16) >> (b / 4)).toString(16)),
  delay: ms =>
    new Promise(resolve =>
      setTimeout(() => resolve(), ms)),
  image: {
    text: {
      // this current implementation requires you to know image size ahead of
      // time(for now)
      compose: (args) => {
        const name = args.name
        const text = args.text
        const canvasWidth = args.canvasWidth
        const canvasHeight = args.canvasHeight
        const imagePath = args.imagePath
        const textColor = args.textColor
        const textY = args.textY
        const outputDir = args.outputDir

        return new Promise((resolve, reject) => {
          const canvas = Canvas.createCanvas(canvasWidth, canvasHeight)
          const ctx = canvas.getContext('2d')

          const Image = Canvas.Image
          const img = new Image()
          img.src = imagePath

          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          ctx.fillStyle = textColor
          ctx.textAlign = 'center'

          const metrics = ctx.measureText(text)
          const xaxis = Math.floor((canvas.width / 2) - (metrics.width / 2)) + metrics.actualBoundingBoxLeft

          ctx.fillText(text, xaxis, parseInt(textY), 100)

          const imageName = `${name}.png`
          const out = fs.createWriteStream(path.join(outputDir, imageName))
          const stream = canvas.createPNGStream()

          stream.on('data', chunk => {
            out.write(chunk)
          });

          stream.on('end', () => {
            console.log(`completed ${text}`)
            resolve(imageName)
          })
        })
      },
    },
  },
  templates: {
    '0': {
      description: 'uhhhh, zeroeth template',
    },
  },
}

module.exports = api
