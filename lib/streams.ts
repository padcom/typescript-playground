import { Readable, ReadableOptions } from 'stream'

class StringStream extends Readable {
  private index = 0
  constructor(public content: string, opts?: ReadableOptions) {
    super(opts)
  }
  _read(size: number): void {
    console.log('StringStream._read(', size, ')')
    this.content.slice(this.index, this.index + size).split('').forEach(c => this.push(c))
    this.index = Math.min(this.index + size, this.content.length)
  }
}

new StringStream('alamakota\n').pipe(process.stdout)

const bytes = new Uint8Array([ 0, 0, 0, 0 ])
const data = new DataView(bytes.buffer)

console.log(bytes)
console.log(data.getInt32(0).toString(16), data.getInt32(0, true).toString(16))

data.setFloat32(0, Math.PI)
console.log(bytes)
console.log(data.getInt32(0).toString(16), data.getInt32(0, true).toString(16))


async function log(lines: Readable) {
  for await (const line of lines) {
    console.log('log:', line.toString())
  }
}

class RandomStream extends Readable {
  private index = 0
  private timer?: NodeJS.Timer

  constructor(public count: number, public interval: number, opts?: ReadableOptions) {
    super(opts)
  }

  _read(size: number): void {
    if (!this.timer) {
      console.log('RandomStream._read(', size, ') - initializing timer')
      this.timer = setInterval(this.produce.bind(this), this.interval)
    } else {
      console.log('RandomStream._read() already called - skipping')
    }
  }

  private produce() {
    if (this.index++ < this.count) {
      console.log('RandomStream.produce() - producing next value')
      this.push(`0x${Math.floor(Math.random() * 100).toString(16)}`)
    } else {
      console.log('RandomStream.produce() - marking the end of values')
      this.push(null)
    }
  }

  _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    console.log('RandomStream._destroy(error =', error, ')')
    if (this.timer) clearInterval(this.timer)
    callback(error)
  }
}

log(new RandomStream(5, 100))

const simple = function*() {
  yield 'x=1'
  yield 'x=2'
  yield 'x=3'
  yield 'x=4'
}
log(Readable.from(simple()))


const random = async function*() {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  for (let i = 0; i < 3; i++) {
    await delay(50)
    yield `0b${Math.round(Math.random() * 1000).toString(2)}`
  }
}

log(Readable.from(random()))
