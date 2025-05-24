import BaseElement from './BaseElement';
import { Text } from 'react-konva';

class TextElement extends BaseElement {
  constructor(id, syncUpdate, props = {}) {
    super(id, 'text', syncUpdate, { text: 'New Text', fontSize: 20, fill: '#000000', ...props });
  }

  getKonvaComponent({ tool, scale, setSelectedId, setState }) {
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
            setSelectedId(`text-${this.id}`);
            e.cancelBubble = true;
          }
        }}
        onDragEnd={(e) => this.handleDragEnd(e, setState)}
      />
    );
  }
}

export default TextElement;