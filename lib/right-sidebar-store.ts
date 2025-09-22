// Simple global store for right sidebar state
class RightSidebarStore {
  private isOpen = false;
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState() {
    return this.isOpen;
  }

  open() {
    this.isOpen = true;
    this.listeners.forEach(listener => listener());
  }

  close() {
    this.isOpen = false;
    this.listeners.forEach(listener => listener());
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.listeners.forEach(listener => listener());
  }
}

export const rightSidebarStore = new RightSidebarStore();