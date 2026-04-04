

## Problem

The Dialog component uses `fixed` positioning centered with `top-[50%] translate-y-[-50%]`, which doesn't allow scrolling when the form content exceeds the viewport height -- especially on mobile (390px viewport). The form has many fields and can grow further with conditional debt/mortgage fields.

## Solution

Convert the Add Account and Edit Account dialogs to use a **Drawer on mobile** and **Dialog on desktop** pattern, leveraging the existing `useIsMobile` hook and Drawer component already in the project.

### Changes

**1. Create a responsive dialog wrapper component** (`src/components/ui/responsive-dialog.tsx`)
- Uses `useIsMobile()` to switch between `Drawer` (mobile) and `Dialog` (desktop)
- Exports `ResponsiveDialog`, `ResponsiveDialogContent`, `ResponsiveDialogHeader`, `ResponsiveDialogTitle`, `ResponsiveDialogDescription`
- The Drawer variant naturally supports scrolling via its bottom-sheet pattern

**2. Update `DialogContent` in `src/components/ui/dialog.tsx`**
- Add `max-h-[85vh] overflow-y-auto` to the existing DialogContent so desktop dialogs also scroll when content overflows

**3. Update `AddAccountDialog.tsx`**
- Import the responsive wrapper instead of raw Dialog
- Wrap form content in a scrollable container
- No logic changes needed

**4. Update `EditAccountDialog.tsx`**
- Same responsive wrapper treatment
- Ensure the nested AlertDialog for delete confirmation still works correctly inside both Dialog and Drawer contexts

This approach reuses existing project components (`Drawer`, `useIsMobile`) and follows the premium UX spec's mobile design rule of using bottom sheets for actions.

