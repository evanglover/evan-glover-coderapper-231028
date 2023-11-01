class EGCartDrawer extends HTMLElement {
    constructor() {
      super();
      // close the cart drawer when the user clicks the cart drawer overlay
      this.querySelector('.cart-drawer-overlay').addEventListener('click', this.close.bind(this));
      // get the cart link in the navigation
      const cartLink = document.querySelector('#cart-icon-bubble');
      // when the cart link is clicked or the space bar is pressed (Accessibilty) open the cart drawer.
      cartLink.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink.addEventListener('keydown', (event) => { 
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    }
  
    // open the cart drawe
    open() {
      // here the animation doesn't seem to always get triggered. A timeout seem to help
      setTimeout(() => {
        document.body.classList.add('overflow-hidden');
        this.classList.add('open');
      });
    }
  
    // close the cart drawer
    close() {
      this.classList.remove('open');
      document.body.classList.remove('overflow-hidden');
    }
  }

  // the main quantity input for each line item
  class EGCartDrawerQTY extends HTMLElement {
    constructor() {
        super();
        
        this.checkoutButton = document.getElementById("CartDrawer-Checkout");
        this.fieldSet = this.closest("fieldset");
        // create debounce function at 300ms to prevent api overload
        this.cartUpdateTimeout;
        this.resetCartUpdateTimeout = (event) => {
          // prevent normal change behavior
          event.preventDefault();
          clearTimeout(this.cartUpdateTimeout);
          // create self reference variable for "this" inside of timeout
          const selfRef = this;
          this.cartUpdateTimeout = setTimeout(function(){
            selfRef.onChange(event);
          }, 300);
        }
    
        // on change, send the event to reset the cart update timeout
        this.addEventListener('change', this.resetCartUpdateTimeout.bind(this));
        // assign changeevent to be an event of type change
        this.changeEvent = new Event('change', { bubbles: true });

        // plus and minus buttons event handler binding
        this.querySelectorAll('button').forEach((button) =>
          button.addEventListener('click', this.qtyButtonClick.bind(this))
        );
      }

      // plus and minus buttons event handler
      qtyButtonClick(event) {
        // prevent nromal button behavior
        event.preventDefault();
        // find the associated quantity input
        this.input = this.querySelector(".quantity-input");
        const previousValue = this.input.value;
        event.currentTarget.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
        
        // validate a change in value, then initiate the change eent
        if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
      }

      // when the qty input is changed, update the quantity in shopify via cart API change
      onChange(event) {
        // @TODO disable the form while Shopify gets updated via API
        this.updateQuantity(event.target.value, event.target.dataset.variantId);
      }

      // quantity change  api uses quantity and id (variant id) parameters
      updateQuantity(quantity, id) {  
        // cart change API asks for viarantId and quantity  
        const body = JSON.stringify({
          quantity,
          id
        });
        // make the api call to cart/change
        fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
          .then((response) => {
            return response.text();
          })
          .then((state) => {
            const parsedState = JSON.parse(state);
            // update new information to the cart
            this.renderCartDrawerUpdates();
          });
      }

      // fetch new cart drawer HTML from a (now updated) cart page.
      renderCartDrawerUpdates(){
        // if on the cart page, reload the page
        if(window.location.pathname == `${routes.cart_url}`){
          location.reload();
        } else {
          // disable the cart form
          const selfRef = this;
          this.cartFormDisable();
          fetch(`${routes.cart_url}?section_id=eg-cart-drawer`)
            .then((response) => response.text())
            .then((responseText) => {
              const html = new DOMParser().parseFromString(responseText, 'text/html');
              // replace cart drawer items and cart drawer footer with the updated version
              const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
              for (const selector of selectors) {
                const targetElement = document.querySelector(selector);
                const sourceElement = html.querySelector(selector);
                if (targetElement && sourceElement) {
                  targetElement.replaceWith(sourceElement);
                }
              }
              
            })
            // once complete, enable the cart form
            .then((info) => {
              selfRef.cartFormEnable();
            })
            // catch errors and print to console
            .catch((e) => {
              console.error(e);
            });
        }
      }

      // while the cart is updating, disable all controls and set checkout text to ""
      cartFormDisable(){
        this.fieldSet.disabled = true;
      }

      cartFormEnable(){
        this.fieldSet.disabled = false;
      }
  }

  // the user clicks the remove button (aka set quantity 0 and trigger update)
  class EGCartDrawerRemoveButton extends HTMLElement {
    constructor() {
      super();
  
      this.addEventListener('click', (event) => {
        event.preventDefault();
        this.input = this.parentElement.querySelector(".quantity-input");
        const previousValue = this.input.value;
        // set input to 0
        this.input.value = 0;
        // trigger cart update cascade
        if (previousValue !== this.input.value) this.input.dispatchEvent(this.parentElement.changeEvent);
      });
    }
  }

  // handles events in the upsell component
  class EGCartDrawerUpsell extends HTMLElement {
    constructor(){
      super();

      // add to cart API call requires variant ID and quantity
      this.variantId = this.dataset.variantId;
      this.quantity = 1;

      // add a click event listener to the add to cart button
      this.querySelector(".cart-drawer-upsell-atc").addEventListener('click', (event) => {
        event.preventDefault();
        this.addToCart(this.quantity, this.variantId);
      });
    }

    addToCart(quantity, id){  
      // cart add API asks for viarantId and quantity  
      const body = JSON.stringify({
        quantity,
        id
      });
      // make the api call to cart/add
      fetch(`${routes.cart_add_url}`, { ...fetchConfig(), ...{ body } })
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);
          // update new information to the cart
          this.closest("eg-cart-drawer").querySelector("eg-cart-drawer-qty").renderCartDrawerUpdates();
        });
    }
  }

  // define custom elements 
  customElements.define('eg-cart-drawer-remove-button', EGCartDrawerRemoveButton);
  customElements.define('eg-cart-drawer', EGCartDrawer);
  customElements.define('eg-cart-drawer-qty', EGCartDrawerQTY);
  customElements.define('eg-cart-drawer-upsell', EGCartDrawerUpsell);
  