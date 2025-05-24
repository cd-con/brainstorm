import BaseElement from './BaseElement';
import { Line } from 'react-konva';

class LineElement extends BaseElement {
  constructor(id, syncUpdate, props = {}) {
    super(id, 'line', syncUpdate, { points: [], color: '#000000', ...props });
  }

  getKonvaComponent({ tool, scale, setSelectedId, setState }) {
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
            setSelectedId(`line-${this.id}`);
            e.cancelBubble = true;
          }
        }}
        onDragEnd={(e) => this.handleDragEnd(e, setState)}
      />
    );
  }
}

export default LineElement;