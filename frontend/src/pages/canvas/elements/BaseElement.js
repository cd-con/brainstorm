class BaseElement {
  constructor(id, type, syncUpdate, props = {}) {
    if (typeof syncUpdate !== 'function') {
      console.error(`syncUpdate must be a function, received: ${syncUpdate}`);
      throw new Error('syncUpdate must be a function');
    }
    this.id = id;
    this.type = type;
    this.syncUpdate = syncUpdate;
    this.properties = { x: 0, y: 0, zIndex: 0, ...props };
  }

  getKonvaComponent() {
    throw new Error('getKonvaComponent must be implemented');
  }

  async updateProperties(newProps, revert) {
    const prev = { ...this.properties };
    this.properties = { ...prev, ...newProps };
    const res = await this.syncUpdate(this.id, this.type, newProps, () => {
      this.properties = prev;
      revert(this);
    });
    return res;
  }

  async handleDragEnd(e, setState) {
    const newPos = { x: e.target.x(), y: e.target.y() };
    const prev = { ...this.properties };
    this.properties = { ...this.properties, ...newPos };
    setState(p => p.map(i => i.id === this.id ? this : i));
    const res = await this.syncUpdate(this.id, this.type, newPos, () => {
      this.properties = prev;
      setState(p => p.map(i => i.id === this.id ? this : i));
    });
    return res;
  }

  handleSelect(select, setSelectedId) {
    select(this.id, this.type);
    setSelectedId(`${this.type}-${this.id}`);
  }

  async delete(setState) {
    const res = await this.syncUpdate(this.id, this.type, null, () => setState(p => [...p, this]));
    return res;
  }
}

export default BaseElement;