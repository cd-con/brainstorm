import BaseElement from './BaseElement';
import { Image } from 'react-konva';

class ImageElement extends BaseElement {
  constructor(id, syncUpdate, props = {}) {
    super(id, 'image', syncUpdate, { width: 100, height: 100, url: null, ...props });
  }

  getKonvaComponent({ tool, scale, setSelectedId, setState }) {
    const img = new window.Image();
    img.src = this.properties.url;
    return (
      <Image
        key={`image-${this.id}`}
        id={`image-${this.id}`}
        image={img}
        x={this.properties.x}
        y={this.properties.y}
        width={this.properties.width / scale}
        height={this.properties.height / scale}
        draggable={tool === 'select'}
        onClick={(e) => {
          if (tool === 'select') {
            setSelectedId(`image-${this.id}`);
            e.cancelBubble = true;
          }
        }}
        onDragEnd={(e) => this.handleDragEnd(e, setState)}
      />
    );
  }
}

export default ImageElement;