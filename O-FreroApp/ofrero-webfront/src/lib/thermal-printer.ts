// Thermal printer utility for Epson receipt printers
// Generates ESC/POS commands for thermal printing

type OrderItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
};

type OrderData = {
  id: string;
  orderNumber?: string;
  createdAt: string;
  totalCents: number;
  items: OrderItem[];
  user: {
    fullName: string;
    email: string;
  } | null;
  shipping: {
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    phone: string;
  };
};

// ESC/POS commands
const ESC = '\x1B';
const GS = '\x1D';

export class ThermalPrinter {
  private commands: string[] = [];

  // Initialize printer
  init() {
    this.commands.push(ESC + '@'); // Initialize
    return this;
  }

  // Text alignment
  alignCenter() {
    this.commands.push(ESC + 'a' + '1');
    return this;
  }

  alignLeft() {
    this.commands.push(ESC + 'a' + '0');
    return this;
  }

  alignRight() {
    this.commands.push(ESC + 'a' + '2');
    return this;
  }

  // Text styling
  bold(enabled = true) {
    this.commands.push(ESC + 'E' + (enabled ? '1' : '0'));
    return this;
  }

  doubleSize() {
    this.commands.push(GS + '!' + '\x11'); // Double width and height
    return this;
  }

  normalSize() {
    this.commands.push(GS + '!' + '\x00');
    return this;
  }

  // Add text
  text(content: string) {
    this.commands.push(content);
    return this;
  }

  // New line
  newLine(count = 1) {
    this.commands.push('\n'.repeat(count));
    return this;
  }

  // Separator line
  separator(char = '-', length = 32) {
    this.commands.push(char.repeat(length));
    this.newLine();
    return this;
  }

  // Cut paper
  cut() {
    this.commands.push(GS + 'V' + '\x00'); // Full cut
    return this;
  }

  // Get final command string
  getCommands() {
    return this.commands.join('');
  }

  // Build receipt for an order
  static buildReceipt(order: OrderData): string {
    const printer = new ThermalPrinter();
    const date = new Date(order.createdAt);

    printer
      .init()
      .alignCenter()
      .doubleSize()
      .bold()
      .text("O'FRERO")
      .newLine()
      .normalSize()
      .text('Restaurant')
      .newLine()
      .separator('=')
      .alignLeft()
      .text(`Commande: ${order.orderNumber || order.id.slice(0, 8)}`)
      .newLine()
      .text(`Date: ${date.toLocaleString('fr-FR')}`)
      .newLine()
      .separator()
      .bold()
      .text('CLIENT')
      .newLine()
      .bold(false)
      .text(order.user?.fullName || 'Client')
      .newLine()
      .text(order.shipping.line1)
      .newLine();

    if (order.shipping.line2) {
      printer.text(order.shipping.line2).newLine();
    }

    printer
      .text(`${order.shipping.postalCode} ${order.shipping.city}`)
      .newLine()
      .text(`Tel: ${order.shipping.phone}`)
      .newLine()
      .separator()
      .bold()
      .text('ARTICLES')
      .newLine()
      .bold(false)
      .separator('-');

    // Items
    order.items.forEach((item) => {
      const itemTotal = (item.quantity * item.unitPriceCents) / 100;
      const unitPrice = item.unitPriceCents / 100;

      printer
        .text(item.name)
        .newLine()
        .text(`  ${item.quantity} x ${unitPrice.toFixed(2)}€`)
        .text(' '.repeat(Math.max(0, 20 - item.name.length)))
        .text(`${itemTotal.toFixed(2)}€`)
        .newLine();
    });

    printer
      .separator('=')
      .bold()
      .doubleSize()
      .text(`TOTAL: ${(order.totalCents / 100).toFixed(2)}€`)
      .newLine()
      .normalSize()
      .bold(false)
      .separator('=')
      .alignCenter()
      .text('Merci de votre visite!')
      .newLine()
      .text("A bientot chez O'Frero")
      .newLine(3)
      .cut();

    return printer.getCommands();
  }

  // Print to USB/Network printer (browser APIs)
  static async print(order: OrderData): Promise<void> {
    const receipt = this.buildReceipt(order);

    // Method 1: Try WebUSB API (Chrome/Edge)
    if ('usb' in navigator) {
      try {
        await this.printViaUSB(receipt);
        return;
      } catch (error) {
        console.warn('USB printing failed, trying fallback:', error);
      }
    }

    // Method 2: Fallback - Open print dialog with formatted HTML
    this.printViaHTML(order);
  }

  // Print via WebUSB (for direct USB connection)
  private static async printViaUSB(commands: string): Promise<void> {
    const filters = [
      { vendorId: 0x04b8 }, // Epson
    ];

    const device = await (navigator as any).usb.requestDevice({ filters });
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);

    const encoder = new TextEncoder();
    const data = encoder.encode(commands);

    await device.transferOut(1, data);
    await device.close();
  }

  // Fallback: Print via HTML (opens print dialog)
  private static printViaHTML(order: OrderData): void {
    const date = new Date(order.createdAt);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket de caisse</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 0;
            padding: 10mm;
            width: 60mm;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 18px; }
          .separator { border-top: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="center bold large">O'FRERO</div>
        <div class="center">Restaurant</div>
        <div class="separator"></div>
        <div>Commande: ${order.orderNumber || order.id.slice(0, 8)}</div>
        <div>Date: ${date.toLocaleString('fr-FR')}</div>
        <div class="separator"></div>
        <div class="bold">CLIENT</div>
        <div>${order.user?.fullName || 'Client'}</div>
        <div>${order.shipping.line1}</div>
        ${order.shipping.line2 ? `<div>${order.shipping.line2}</div>` : ''}
        <div>${order.shipping.postalCode} ${order.shipping.city}</div>
        <div>Tel: ${order.shipping.phone}</div>
        <div class="separator"></div>
        <div class="bold">ARTICLES</div>
        <div class="separator"></div>
        <table>
          ${order.items.map(item => `
            <tr>
              <td colspan="3">${item.name}</td>
            </tr>
            <tr>
              <td>  ${item.quantity} x ${(item.unitPriceCents / 100).toFixed(2)}€</td>
              <td></td>
              <td class="right">${((item.quantity * item.unitPriceCents) / 100).toFixed(2)}€</td>
            </tr>
          `).join('')}
        </table>
        <div class="separator"></div>
        <div class="center bold large">TOTAL: ${(order.totalCents / 100).toFixed(2)}€</div>
        <div class="separator"></div>
        <div class="center">Merci de votre visite!</div>
        <div class="center">A bientot chez O'Frero</div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 100);
      };
    }
  }
}
