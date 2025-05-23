class BaseElement {
  constructor(id, type, syncUpdate, properties = {}) {
    this.id = id;
    this.type = type;
    this.syncUpdate = syncUpdate;
    this.properties = {
      x: 0,
      y: 0,
      zIndex: 0,
      ...properties
    };
  }

  // Method to get Konva component for rendering
  getKonvaComponent() {
    throw new Error('getKonvaComponent must be implemented by subclass');
  }

  // Method to update properties and sync with server
  async updateProperties(newProperties, revertCallback) {
    const prevProperties = { ...this.properties };
    this.properties = { ...this.properties, ...newProperties };

    const response = await this.syncUpdate(
      this.id,
      this.type,
      newProperties,
      () => {
        this.properties = prevProperties;
        revertCallback(this);
      }
    );

    return response;
  }

  // Method to handle drag end
  async handleDragEnd(e, setState) {
    const newPos = { x: e.target.x(), y: e.target.y() };
    const prevProperties = { ...this.properties };

    setState(prev => prev.map(item => 
      item.id === this.id ? { ...item, ...newPos } : item
    ));

    const response = await this.syncUpdate(
      this.id,
      this.type,
      newPos,
      () => {
        this.properties = prevProperties;
        setState(prev => prev.map(item => 
          item.id === this.id ? { ...item, ...prevProperties } : item
        ));
      }
    );

    return response;
  }

  // Method to handle selection
  handleSelect(selectObject, setSelectedId) {
    selectObject(this.id, this.type);
    setSelectedId(`${this.type}-${this.id}`);
  }

  // Method to get the identifier
  getIdentifier() {
    return `${this.type}-${this.id}`;
  }

  // Method to delete element
  async delete(setState) {
    const response = await this.syncUpdate(this.id, this.type, null, () => {
      setState(prev => [...prev, this]);
    });
    return response;
  }
}

export default BaseElement;