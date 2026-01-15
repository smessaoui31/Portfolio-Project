// src/hooks/useFlyingCart.ts
"use client";

import { useState, useCallback } from "react";

type Position = { x: number; y: number };

type FlyingCartState = {
  isAnimating: boolean;
  startPosition: Position | null;
  endPosition: Position | null;
  productImage?: string;
};

export function useFlyingCart() {
  const [state, setState] = useState<FlyingCartState>({
    isAnimating: false,
    startPosition: null,
    endPosition: null,
    productImage: undefined,
  });

  const triggerFlyingCart = useCallback(
    (buttonElement: HTMLElement, cartElement: HTMLElement, productImage?: string) => {
      // Get button position
      const buttonRect = buttonElement.getBoundingClientRect();
      const cartRect = cartElement.getBoundingClientRect();

      const startPosition = {
        x: buttonRect.left + buttonRect.width / 2 - 40, // Center the 80px element
        y: buttonRect.top + buttonRect.height / 2 - 40,
      };

      const endPosition = {
        x: cartRect.left + cartRect.width / 2 - 40,
        y: cartRect.top + cartRect.height / 2 - 40,
      };

      setState({
        isAnimating: true,
        startPosition,
        endPosition,
        productImage,
      });
    },
    []
  );

  const resetAnimation = useCallback(() => {
    setState({
      isAnimating: false,
      startPosition: null,
      endPosition: null,
      productImage: undefined,
    });
  }, []);

  return {
    ...state,
    triggerFlyingCart,
    resetAnimation,
  };
}
