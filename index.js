const api = require('./lib')
const fs = require('fs-extra')
const spawn = require('child_process').spawn

/*
 compose text on images
 combine with
*/
// eehhh IIRC you cant use relative paths with canvas image source
const outputDir = `${__dirname}/output/${api.uuid()}`

doGlob()
//doFpsVideoFilter()
async function doFpsVideoFilter() {
  fs.ensureDirSync(outputDir)
  const imageName0 = await api.image.text.compose({
    text: 'TEST!',
    // canvas dims does not have to equal image dims
    canvasWidth: 770,
    canvasHeight: 480,
    imagePath: `${__dirname}/resources/tree-736885__480.jpg`,
    textColor: 'white',
    textY: 100,
    outputDir,
  })
  const imageName1 = await api.image.text.compose({
    text: 'SECOND IMAGE',
    canvasWidth: 770,
    canvasHeight: 480,
    imagePath: `${__dirname}/resources/tree-736885__480.jpg`,
    textColor: 'white',
    textY: 150,
    outputDir,
  })

  // create file list for ffmpeg
  fs.appendFileSync(
`${outputDir}/fileList.txt`,
`file '${outputDir}/${imageName0}'
file '${outputDir}/${imageName1}'`, {encoding:'utf8'})

  // give it a second to flush IO
  await api.delay(2000)

  const p = spawn('ffmpeg', [
    '-y', '-r', '-f', 'concat', '-safe', '0', '1/5', '-i', `${outputDir}/fileList.txt`, '-c:v', 'libx264', '-vf', 'fps=25', '-pix_fmt', 'yuv420p', `${outputDir}/out.mp4`
  ])
  p.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  p.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })
  p.on('close', (code) => {
    console.log('result written to', outputDir)
  })
}

async function doGlob() {
  fs.ensureDirSync(outputDir)
  const images = [
    {text: 'ZEROETH', y: 100},
    {text: 'FIRST', y: 200},
    {text: 'SECOND', y: 300},
    {text: 'THIRD', y: 400},
    {text: 'FOURTH', y: 500},
    {text: 'FIFTH', y: 600},
  ]
  images.forEach(async img => {
    await api.image.text.compose({
      text: img.text,
      // canvas dims does not have to equal image dims
      canvasWidth: 770,
      canvasHeight: 480,
      imagePath: `${__dirname}/resources/tree-736885__480.jpg`,
      textColor: 'white',
      textY: img.y,
      outputDir,
    })
  })

  // give it a second to flush IO
  await api.delay(2000)

  const p = spawn('ffmpeg', [
    '-framerate', '30', '-pattern_type', 'glob', '-i', `${outputDir}/*.png`, '-c:v', 'libx264', `${outputDir}/out.mp4`
  ])
  p.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  p.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })
  p.on('close', (code) => {
    console.log('result written to', outputDir)
  })
}
