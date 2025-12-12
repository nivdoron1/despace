#!/bin/bash

# Array of shadcn/ui components to install
components=(
  "accordion"
  "alert-dialog"
  "alert"
  "aspect-ratio"
  "avatar"
  "badge"
  "breadcrumb"
  "button-group" 
  "button"
  "calendar"
  "card"
  "carousel"
  "chart" 
  "checkbox"
  "collapsible"
  "combobox"
  "command"
  "context-menu"
  "data-table"
  "date-picker"
  "dialog"
  "drawer"
  "dropdown-menu"
  "empty"
  "field"
  "input-group"
  "item"
  "kbd"
  "native-select"
  "button-group"
  "chart"
  "form"
  "hover-card"
  "input-otp"
  "input"
  "label"
  "menubar"
  "navigation-menu"
  "pagination"
  "popover"
  "progress"
  "radio-group"
  "resizable"
  "scroll-area"
  "select"
  "separator"
  "sheet"
  "sidebar"
  "skeleton"
  "slider"
  "sonner"
  "spinner"
  "switch"
  "table"
  "tabs"
  "textarea"
  "toast"
  "toggle-group"
  "toggle"
  "tooltip"
  "typography" # Installs the "p", "blockquote", "ul", "ol", "li", "a", "h1" to "h6" components.
)

echo "Starting installation of all specified shadcn/ui components..."
echo "---"

# Loop through the array and run the npx shadcn add command for each component
for component in "${components[@]}"; do
  echo "Installing: **$component**"
  npx shadcn@latest add "$component"
  if [ $? -eq 0 ]; then
    echo "Successfully installed: $component"
  else
    echo "⚠️ ERROR installing: $component"
    # Decide if you want to stop on error or continue. 
    # Current setting: continue to the next component.
  fi
  echo "---"
done

echo "✅ All specified shadcn/ui components installation attempts complete."