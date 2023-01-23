const api = require('./lib')
const fs = require('fs-extra')
const spawn = require('child_process').spawn
const path = require('path')

/*
 compose text on images
 combine with
*/
// eehhh IIRC you cant use relative paths with canvas image source
const outputDir = `${__dirname}/output/${api.uuid()}`

doConcatDemuxer()
//doGlob()
//doFpsVideoFilter()

async function doConcatDemuxer() {
  fs.ensureDirSync(outputDir)
  const images = [
    {text: 'ZEROETH', y: 100, duration: 1},
    {text: 'FIRST', y: 200, duration: 2},
    {text: 'SECOND', y: 250, duration: 3},
    {text: 'THIRD', y: 300, duration: 4},
    {text: 'FOURTH', y: 350, duration: 5},
    {text: 'FIFTH', y: 400, duration: 6},
  ]
  let inputText = ''
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const composeRes = await api.image.text.compose({
      name: `${i}`,
      text: img.text,
      // canvas dims does not have to equal image dims
      canvasWidth: 770,
      canvasHeight: 480,
      imagePath: `${__dirname}/resources/tree-736885__480.jpg`,
      textColor: 'white',
      textY: img.y,
      outputDir,
    })
    inputText += `file '${path.join(outputDir, composeRes)}'\n`
    inputText += `duration ${img.duration}\n`
    if (i + 1 === images.length) {
      inputText += `file '${path.join(outputDir, composeRes)}'`
    }
  }

  fs.appendFileSync(`${outputDir}/input.txt`, inputText)

  // give it a second to flush IO
  await api.delay(2000)

  const p = spawn('ffmpeg', [
    // concat without specifying framerate and rate
    //'-f', 'concat', '-safe', '0', '-i', `${outputDir}/input.txt`, '-vsync', 'vfr', '-pix_fmt', 'yuv420p', `${outputDir}/out.mp4`
    // fps video filter...
    '-f', 'concat', '-safe', '0', '-i', `${outputDir}/input.txt`, '-c:v', 'libx264', '-vf', 'fps=25', '-pix_fmt', 'yuv420p', `${outputDir}/out.mp4`
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

async function doFpsVideoFilter() {
  fs.ensureDirSync(outputDir)
  const imageName0 = await api.image.text.compose({
    name: '0',
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
    name: '1',
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
  images.forEach(async (img, i) => {
    await api.image.text.compose({
      name: `${i}`,
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
