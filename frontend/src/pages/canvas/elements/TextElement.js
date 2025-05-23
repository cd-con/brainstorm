import BaseElement from './BaseElement';
import { Text } from 'react-konva';

class TextElement extends BaseElement {
  constructor(id, syncUpdate, properties = {}) {
    super(id, 'text', syncUpdate, {
      text: 'New Text',
      fontSize: 20,
      fill: '#000000',
      ...properties
    });
  }

  getKonvaComponent({ tool, scale, handleSelect, handleDragEnd }) {
    return (
      <Text
        key={`text-${this.id}`}
        id={`text-${this.id}`}
        text={this.properties.text}
        x={this.properties.x}
        y={this.properties.y}
        fontSize={this.properties.fontSize / scale}
        fill={this.properties.fill}
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

export default TextElement;