import BaseElement from './BaseElement';
import { Line } from 'react-konva';

class LineElement extends BaseElement {
  constructor(id, syncUpdate, properties = {}) {
    super(id, 'line', syncUpdate, {
      points: [],
      color: '#000000',
      ...properties
    });
  }

  getKonvaComponent({ tool, scale, handleSelect, handleDragEnd }) {
    return (
      <Line
        key={`line-${this.id}`}
        id={`line-${this.id}`}
        points={this.properties.points}
        stroke={this.properties.color}
        strokeWidth={5 / scale}
        lineCap="round"
        lineJoin="round"
        draggable={tool === 'select'}
        x={this.properties.x}
        y={this.properties.y}
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

export default LineElement;