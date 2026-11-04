import { Point } from '../run/autoRoute';

/** A choice is backed by a live game object, not a stale map coordinate. */
export interface ExploreChoice {
  label: string;
  position: () => Point | null;
}

export class ExploreMenu {
  private root: HTMLDivElement;
  private trigger: HTMLButtonElement;
  private panel: HTMLDivElement;
  private status: HTMLDivElement;
  private open = false;

  constructor(
    private choices: () => ExploreChoice[],
    private select: (choice: ExploreChoice) => boolean,
    private stop: () => void,
    private canOpen: () => boolean,
    private onToggle: (open: boolean) => void,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'auto-explore';
    this.root.style.cssText = 'position:fixed;right:12px;top:92px;z-index:1300;max-width:75vw;font:16px system-ui,sans-serif;color:white';
    this.trigger = document.createElement('button');
    this.trigger.type = 'button';
    this.trigger.textContent = '🧭 Điểm đến';
    this.trigger.setAttribute('aria-label', 'Mở danh sách điểm đến');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.style.cssText = 'font:inherit;font-weight:700;color:white;background:#166534;border:2px solid #b7f7c8;border-radius:10px;padding:12px;min-height:48px;cursor:pointer';
    this.trigger.onclick = () => this.toggle();
    this.root.appendChild(this.trigger);

    this.status = document.createElement('div');
    this.status.setAttribute('role', 'status');
    this.status.setAttribute('aria-live', 'polite');
    this.status.style.cssText = 'font-size:13px;background:#101827;border-radius:6px;padding:5px;margin-top:6px;max-width:260px';
    this.status.textContent = 'Chọn Điểm đến để tự di chuyển.';
    this.root.appendChild(this.status);

    this.panel = document.createElement('div');
    this.panel.hidden = true;
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.setAttribute('aria-label', 'Danh sách điểm đến');
    this.panel.style.cssText = 'position:fixed;inset:6%;z-index:1301;overflow-y:auto;padding:20px;background:#101827;border:2px solid #82ccaa;border-radius:12px;box-shadow:0 0 0 100vmax rgba(0,0,0,.75)';
    this.root.appendChild(this.panel);
    document.body.appendChild(this.root);
  }

  announce(message: string): void { this.status.textContent = message; }

  private appendButton(label: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'display:block;width:100%;text-align:left;min-height:48px;margin:8px 0;padding:12px;font:17px system-ui,sans-serif;color:white;background:#24364b;border:1px solid #9cb1ce;border-radius:9px';
    button.onclick = action;
    this.panel.appendChild(button);
    return button;
  }

  private toggle(): void {
    if (this.open) { this.close(); return; }
    if (!this.canOpen()) { this.announce('Hãy hoàn thành màn hình hiện tại trước khi mở danh sách.'); return; }
    this.open = true;
    this.onToggle(true);
    this.trigger.setAttribute('aria-expanded', 'true');
    this.panel.replaceChildren();
    this.panel.hidden = false;
    const heading = document.createElement('h2');
    heading.textContent = 'Chọn nơi muốn đến';
    heading.tabIndex = -1;
    heading.style.cssText = 'margin:0 0 8px;font-size:22px';
    this.panel.appendChild(heading);
    const choices = this.choices();
    for (const choice of choices) {
      this.appendButton(choice.label, () => {
        if (this.select(choice)) {
          this.announce('Đang tự di chuyển đến ' + choice.label + '.');
          this.close();
        } else {
          this.announce('Không tìm thấy đường đi đến ' + choice.label + '.');
        }
      });
    }
    if (!choices.length) this.appendButton('Hiện chưa có địa điểm khả dụng.', () => {});
    this.appendButton('Dừng di chuyển tự động', () => {
      this.stop();
      this.close();
    });
    this.appendButton('Đóng danh sách', () => this.close());
    heading.focus();
  }

  private close(): void {
    if (!this.open) return;
    this.open = false;
    this.panel.hidden = true;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.onToggle(false);
    this.trigger.focus();
  }

  destroy(): void {
    if (this.open) { this.open = false; this.onToggle(false); }
    this.root.remove();
  }
}
