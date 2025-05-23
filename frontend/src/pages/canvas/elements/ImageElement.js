import BaseElement from './BaseElement';
import { Image } from 'react-konva';

class ImageElement extends BaseElement {
  constructor(id, syncUpdate, properties = {}) {
    super(id, 'image', syncUpdate, {
      width: 100,
      height: 100,
      image: null,
      url: null,
      ...properties
    });
  }

  getKonvaComponent({ tool, scale, handleSelect, handleDragEnd }) {
    const imageObj = this.properties.image || (this.properties.url ? new window.Image() : null);
    if (this.properties.url && imageObj) {
      imageObj.src = this.properties.url;
    }

    return (
      <Image
        key={`image-${this.id}`}
        id={`image-${this.id}`}
        image={imageObj}
        x={this.properties.x}
        y={this.properties.y}
        width={this.properties.width / scale}
        height={this.properties.height / scale}
        draggable={tool === 'select'}
        onClick={(e) => {
          if (tool === 'select') {
            handleSelect(this);
            e.cancelBubble = true;
          }
        }}
        onDragEnd={(e) => handleDragEnd(this, e)}
      />
    );
  }
}

export default ImageElement;