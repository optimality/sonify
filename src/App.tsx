import './App.css';
import * as Tone from 'tone';
import centa from './centa.jpg';
import * as React from 'react';

class ImageProcessing {
  static getRGBPixel(x: number, y: number, imageData: ImageData): Uint8ClampedArray {
    const index = (y * imageData.width + x) * 4;
    return imageData.data.slice(index, index + 4);
  }

  static getHSVPixel(x: number, y: number, imageData: ImageData): Uint8ClampedArray {
    const rgbPixel = this.getRGBPixel(x, y, imageData);
    return this.rgbToHSV(rgbPixel[0], rgbPixel[1], rgbPixel[2]);
  }

  static rgbToHSV(r: number, g: number, b: number): Uint8ClampedArray {
    r /= 255;
    g /= 255;
    b /= 255;
  
    const x_max = Math.max(r, g, b);
    const x_min = Math.min(r, g, b);
    const value = x_max;
    const chroma = x_max - x_min;
    const saturation = value === 0 ? 0 : chroma / value;
    var hue = null;
    if (value === 0) {
      hue = 0;
    } else if (value === r) {
      hue = 60 * (g - b) / chroma;
    } else if (value === g) {
      hue = 60 * (2 + (b - r) / chroma);
    } else if (value === b) {
      hue = 60 * (4 + (r - g) / chroma);
    }
  
    return Uint8ClampedArray.of(hue!, saturation, value);
  }

  static saturationRow(y: number, imageData: ImageData): Array<number> {
    var row: Array<number> = [];
    for(let i = 0; i < imageData.width; ++i) {
      const saturation = this.getHSVPixel(i, y, imageData)[1];
      row.push(saturation);
    }
    return row;
  }

  static valueRow(y: number, imageData: ImageData): Array<number> {
    var row: Array<number> = [];
    for(let i = 0; i < imageData.width; ++i) {
      const saturation = this.getHSVPixel(i, y, imageData)[2];
      row.push(saturation);
    }
    return row;
  }

  static saturationData(imageData: ImageData): Array<Array<number>> {
    var data: Array<Array<number>> = [];
    for (let i = 0; i < imageData.height; ++i) {
      const row = this.saturationRow(i, imageData);
      data.push(row);
    }

    return data;
  }

  static valueData(imageData: ImageData): Array<Array<number>> {
    var data: Array<Array<number>> = [];
    for (let i = 0; i < imageData.height; ++i) {
      const row = this.valueRow(i, imageData);
      data.push(row);
    }

    return data;
  }
}

class Player extends React.Component<{imageData: ImageData | null}> {
  async onClick() {
    await Tone.start();
    if (this.props.imageData === null) {
      return;
    }
    // const data = ImageProcessing.saturationData(this.props.imageData);
    const data = ImageProcessing.valueData(this.props.imageData);

    const low_freq = 40;  //hz
    const high_freq = 1400; //hz
    const notes = [];
    for (let i = 0; i < this.props.imageData.width; ++i) {
      notes.push((high_freq - low_freq) * (i / this.props.imageData.width) + low_freq);
    }

    var piece = [];
    for (let i = 0; i < /*this.props.imageData.height*/ 40; ++i) {
      const time = i;
      for (let j = 0; j < this.props.imageData.width; ++j) {
        const velocity = data[i][j];
        if (velocity < 0.1) {
          continue;
        }
        const note = {
          time: time,
          note: notes[j],
          velocity: velocity,
        };
        piece.push(note);
      }
    }

    console.log(piece);
   
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    new Tone.Part(((time, value) => {
      synth.triggerAttackRelease(value.note, 1, time, value.velocity);
    }), piece).start(0);
    Tone.Transport.start();
  }

  render() {
    return (<button onClick={() => this.onClick()}>Play Image</button>)
  }
}

class Canvas extends React.Component<{onUpdate: (imageData: ImageData) => void}> {
  private canvas = React.createRef<HTMLCanvasElement>();

  componentDidMount() {
    const image = new Image();
    image.onload = function(this: Canvas) {
      if (this.canvas.current === null) {
        return;
      }
      this.canvas.current.width = image.width;
      this.canvas.current.height = image.height;
      const ctx = this.canvas.current.getContext("2d");
      if (ctx === null) {
        return;
      }
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, this.canvas.current.width, this.canvas.current.height);
      this.props.onUpdate(pixels);
    }.bind(this);
    image.src = centa;
  }

  render() {
    return (<div>
       <canvas ref={this.canvas}>The canvas.</canvas> </div>);
  }
}

class App extends React.Component<void, {imageData: ImageData | null}> {
  constructor(props: void) {
    super(props);

    this.handleUpdate = this.handleUpdate.bind(this);
    this.state = {
      imageData: null,
    }
  }

  handleUpdate(pixels: ImageData) {
    this.setState({
      imageData: pixels,
    })
  }

  render() {
    return (
        <div className="App">
        <Player imageData={this.state.imageData}></Player>
        <Canvas onUpdate={this.handleUpdate}/>
      </div>
    );
  }
}

export default App;
