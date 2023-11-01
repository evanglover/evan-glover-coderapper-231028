# Evan Glover Theme Code Challenge for Coderapper Oct 2023

## EG Side Cart 
This theme contains an interactive ajax side cart. It contains  a few react components that will fetch and display the product information from Shopify.
* A Shopify sandbox store was created with default test data and a sandbox theme was created using the Shopify CLI.

## Task #1 :
A simple Shopify side cart named eg-side-cart was impleented using Javascript/React. If you are familiar
with other JS frameworks like alpine js to build this component feel free to use them.

The side cart supports the following actions:
* Change the quantity of existing cart item (updates state to render the new selection and submits to Shopify Ajax cart change).
* Remove the item from the cart (updates state to render cart without this item, and submit the change to Shopify Ajax cart)

* There is a conditional upsell product for Y that displays when product X is present in the cart. The add to cart button will update the cart state and submit the change to Shopify.

eg-cart-drawer.liquid
```html
{% comment %} If product to trigger upsell is present, and upsell product is not present, then show an upsell component for the upsell product {% endcomment %}
{%- assign upsell_trigger_handles_string = "the-3p-fulfilled-snowboard" -%} 
{%- assign upsell_trigger_handles_array = upsell_trigger_handles_string | split: ',' -%}
{%- assign upsell_handles_string = "the-multi-location-snowboard" -%}
{%- assign upsell_handles_array = upsell_handles_string | split: "," -%}
{%- assign upsell_handles_to_display = "" -%}
{% comment %} Check the cart for the trigger product {% endcomment %}
{%- for trigger_item in cart.items -%} 
{%- if upsell_trigger_handles_string contains trigger_item.product.handle -%}
    {% comment %} Get the index of the trigger product {% endcomment %}
    {%- assign trigger_index = false -%}
    {%- for trigger_handle in upsell_trigger_handles_array -%}
    {%- if trigger_handle == trigger_item.product.handle -%}
        {%- assign trigger_index = forloop.index0 -%}
    {%- endif -%}
    {%- endfor -%}
    {%- if trigger_index -%}
    {% comment %} Make sure the upsell product is not already in the cart {% endcomment %} 
    {%- assign upsell_handle = upsell_handles_array[trigger_index] -%}
    {%- assign render_upsell = true -%}
    {%- for item in cart.items -%}  
        {%- if item.product.handle == upsell_handle -%} 
        {% comment %} The upsell product is already in the cart {% endcomment %}
        {%- assign render_upsell = false -%}
        {%- break -%} 
        {%- endif -%}
    {%- endfor -%}
    {%- if render_upsell -%}
        {% comment %} Add the upsell to the list of handles to render {% endcomment %}
        {%- assign upsell_handles_to_display = upsell_handles_to_display | append: upsell_handle | append: "," -%}
    {%- endif -%}
    {%- endif -%}
{%- endif -%}
{%- endfor -%}

{% comment %} Render the upsell section{% endcomment %}
{%- if upsell_handles_to_display != "" -%}
{%- assign upsell_handles_to_display_array = upsell_handles_to_display | split: "," -%}
<div>
    <h3>You may also like...</h3>
    
    {%- for upsell_handle in upsell_handles_to_display_array -%} 
    {%- assign upsell_product = all_products[upsell_handle] -%}
    <div> 
        <eg-cart-drawer-upsell id="cart-drawer-item-upsell-{{ forloop.index }}" class="cart-drawer-item cart-drawer-upsell" data-quantity="1" data-variant-id="{{ upsell_product.first_available_variant.id }}">
        {%- if upsell_product.featured_image -%}
        <img
            class="cart-drawer-item-image"
            src="{{ upsell_product.featured_image | image_url: width: 300 }}"
            width="150"
            height="{{ 150 | divided_by: upsell_product.featured_image.aspect_ratio | ceil }}"
        >
        {%- endif -%}
        <div class="cart-item-detais">
            <a href="{{ upsell_product.url }}" class="cart-item__name h4 break">
            {{ upsell_product.title | escape }}
            </a>
            <span class="product-price price price--end">
            {{ upsell_product.price | money }} 
            </span>
            <button class="cart-drawer-upsell-atc">
            Add to Cart
            </button>
        </div> 
        
        </eg-cart-drawer-upsell>
    </div> 
    {%- endfor -%}
</div>
{%- endif -%}
```

eg-cart-drawer.js
```js
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
          // update new information to the cart by triggering the async refresh function in the quantity controller of another line item.
          this.closest("eg-cart-drawer").querySelector("eg-cart-drawer-qty").renderCartDrawerUpdates();
        });
    }
  }

  ...
  customElements.define('eg-cart-drawer-upsell', EGCartDrawerUpsell); 

```


* Both changes in quantity, removal, and  utilize the Shopify Cart API "change" endpoint, which accepts parameters "id" (variant id) and "quantity" in order to edit the line items of the user's cart. The add to cart functionality of the conditional upsell utilizes the Shopify Cart API "add" endpoint which takes the parameters "quanitity" and "id" (variant id). See routes below. Also see functions updateQuantity of class EGCartDrawerQTY and addToCart of EGCartDrawerUpsell in file 'eg-cart-drawer.js'.

theme.liquid
``` js
window.shopUrl = 'https://evan-glover-coderapper-10-28-23.myshopify.com';
window.routes = {
    cart_add_url: '/cart/add',
    cart_change_url: '/cart/change',
    cart_update_url: '/cart/update',
    cart_url: '/cart',
    predictive_search_url: '/search/suggest',
};
```

* All controls disable when a modification is in progress, this is achieved by utlizing the html fieldset element to disable all controls of the form simultaneously. 

eg-cart-drawer.liquid
```html
<eg-cart-drawer class="eg-cart-drawer open{% if cart == empty %} is-empty{% endif %}">
  <div class="cart-drawer-overlay"></div> 
  <div class="cart-drawer">
    <fieldset>
```

eg-cart-drawer.js 
```js
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
...
// while the cart is updating, disable all controls and set checkout text to ""
cartFormDisable(){
    this.fieldSet.disabled = true;
}

cartFormEnable(){
    this.fieldSet.disabled = false;
}
```


