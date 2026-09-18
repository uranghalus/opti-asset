describe('Mobile Asset UI Tests', () => {
  const mobileViewport = { width: 375, height: 667 };

  beforeEach(() => {
    cy.viewport(mobileViewport.width, mobileViewport.height);
    cy.visit('/login');
    // perform login - replace with real credentials or fixture
    cy.get('input[name="email"]').type('staff@example.com');
    cy.get('input[name="password"]').type('secret');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('uploads asset via mobile form', () => {
    cy.visit('/assets/create');
    cy.get('input[name="kode_asset"]').type('01.02.03.004');
    cy.get('input[name="name"]').type('Laptop Test');
    // ensure button has min-height >=44px (Cypress cannot measure CSS directly; use getComputedStyle)
    cy.get('button[type="submit"]').should(($btn) => {
      const height = $btn[0].getBoundingClientRect().height;
      expect(height).to.be.gte(44);
    });
    cy.get('button[type="submit"]').click();
    cy.contains('Berhasil menyimpan aset').should('exist');
  });

  it('scans asset via barcode scanner fallback', () => {
    cy.visit('/assets/scan');
    // Simulate manual code entry fallback path
    cy.get('input[placeholder*="Masukkan kode aset"]').type('01.01.01.001');
    cy.get('button').contains('Cari').click();
    cy.contains('Aset ditemukan').should('exist');
    cy.get('button').contains('Lihat Detail').click();
    cy.url().should('match', /\/assets\/\w+/);
  });

  it('renders asset cards on mobile', () => {
    cy.visit('/assets');
    // Verify each asset is inside a card (has class "glass-card")
    cy.get('.glass-card').should('have.length.at.least', 1);
    // Ensure grid reduces to single column on mobile
    cy.get('.grid').then(($grid) => {
      const colCount = getComputedStyle($grid[0]).gridTemplateColumns.split(' ').length;
      expect(colCount).to.eq(1);
    });
  });
});