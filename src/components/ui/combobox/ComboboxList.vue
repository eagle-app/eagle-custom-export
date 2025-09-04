<script setup>
import { reactiveOmit } from "@vueuse/core";
import { ComboboxContent, ComboboxPortal, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps({
  forceMount: { type: Boolean, required: false },
  position: { type: String, required: false, default: "popper" },
  bodyLock: { type: Boolean, required: false },
  side: { type: null, required: false },
  sideOffset: { type: Number, required: false, default: 4 },
  sideFlip: { type: Boolean, required: false },
  align: { type: null, required: false, default: "center" },
  alignOffset: { type: Number, required: false },
  alignFlip: { type: Boolean, required: false },
  avoidCollisions: { type: Boolean, required: false },
  collisionBoundary: { type: null, required: false },
  collisionPadding: { type: [Number, Object], required: false },
  arrowPadding: { type: Number, required: false },
  sticky: { type: String, required: false },
  hideWhenDetached: { type: Boolean, required: false },
  positionStrategy: { type: String, required: false },
  updatePositionStrategy: { type: String, required: false },
  disableUpdateOnLayoutShift: { type: Boolean, required: false },
  prioritizePosition: { type: Boolean, required: false },
  reference: { type: null, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  disableOutsidePointerEvents: { type: Boolean, required: false },
  class: { type: null, required: false },
});
const emits = defineEmits([
  "escapeKeyDown",
  "pointerDownOutside",
  "focusOutside",
  "interactOutside",
]);

const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxPortal>
    <ComboboxContent data-slot="combobox-list" v-bind="forwarded" :class="cn(
      'z-50 rounded-md border bg-popover text-popover-foreground origin-(--reka-combobox-content-transform-origin) shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      props.class,
    )
      ">
      <slot />
    </ComboboxContent>
  </ComboboxPortal>
</template>

<style scoped>
::v-deep(.combobox-list) {
  background: var(--box-background);
  border-top: var(--box-border-top);
  border-left: var(--box-border-left);
  border-right: var(--box-border-right);
  border-bottom: var(--box-border-bottom);
  box-shadow: var(--box-border-shadow);
  backdrop-filter: var(--box-background-blur);
}

::v-deep([data-slot="combobox-list"]) {
  max-height: 300px !important;
  overflow-y: auto !important;
}

::v-deep(.combobox-group) {
  padding: 0 !important;
  position: relative;
  margin-bottom: 5px;
  overflow: initial;
}

::v-deep(.combobox-group:not(:last-child):after) {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-border-secondary);
}

::v-deep(.combobox-item) {
  min-width: 120px;
  max-width: 300px;  
  width: fit-content;
}

</style>