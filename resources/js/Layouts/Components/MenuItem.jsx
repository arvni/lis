// MenuItem.jsx - Fixed Version

import React, {useState, useCallback, memo, useEffect} from "react";
import PropTypes from "prop-types";
import {
    Avatar,
    Collapse,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    alpha,
    useTheme
} from "@mui/material";
import {
    ExpandLess,
    ExpandMore
} from "@mui/icons-material";
import {refactorRoute} from "@/routes";
import {usePage} from "@inertiajs/react";

// Safely parse URL without throwing errors
const safeParseURL = (url) => {
    if (!url) return null;
    try {
        if (URL.canParse(url)) {
            return URL.parse(url).pathname;
        }
    } catch (e) {
        console.error("URL parsing error:", e);
    }
    return null;
};

/**
 * Enhanced MenuItem Component - Renders a navigation menu item with optional submenu
 */
const MenuItem = memo(({item, permissions, onNavigate, isNested = false}) => {
    // Always call hooks at the top level
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const {url} = usePage();

    // Safely get current item URL
    const itemRoute = item?.route ? refactorRoute(item.route) : '';
    const itemURL = safeParseURL(itemRoute);

    // Ensure item has required properties
    const safeItem = {
        title: item?.title || "Untitled",
        route: itemRoute,
        icon: item?.icon || null,
        permission: item?.permission || null,
        child: Array.isArray(item?.child) ? item.child : [],
        selected: item?.selected || false
    };

    // Check permissions - but after hooks have been called
    const isPermitted = !Boolean(safeItem.permission) || permissions.includes(safeItem.permission);

    // Determine if this menu item has child items
    const hasSubmenu = safeItem.child.length > 0;

    // Check if current route matches this menu item's route
    const isCurrentRoute = itemURL && url.startsWith(itemURL);

    // Check if any child route is current
    const hasActiveChild = hasSubmenu && safeItem.child.some(child => {
        const childRoute = child?.route ? refactorRoute(child.route) : '';
        const childURL = safeParseURL(childRoute);
        return childURL && url.startsWith(childURL);
    });

    // Auto-expand menu items with active children or if they match current route
    useEffect(() => {
        if (hasActiveChild || isCurrentRoute) {
            setOpen(true);
        }
    }, [hasActiveChild, isCurrentRoute]);

    // Skip rendering if user doesn't have permission
    if (!isPermitted) return null;

    // Define dynamic styles based on the current theme
    const styles = {
        listItem: {
            transition: "all 0.2s ease",
            borderRadius: "8px",
            margin: isNested ? "2px 4px 2px 8px" : "4px 8px",
            padding: isNested ? "6px 16px" : "8px 16px",
            "&.Mui-selected": {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.2),
                fontWeight: "500",
                color: theme.palette.primary.main,
                "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.18 : 0.3),
                },
                "& .MuiListItemIcon-root": {
                    color: theme.palette.primary.main,
                }
            },
            "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.1),
                transform: "translateX(4px)",
                "& .MuiListItemIcon-root": {
                    transform: "scale(1.1)",
                }
            }
        },
        icon: {
            minWidth: 40,
            display: "flex",
            justifyContent: "center",
            transition: "transform 0.2s ease, color 0.2s ease",
            color: theme.palette.mode === 'light' ? theme.palette.text.secondary : theme.palette.text.primary,
        },
        avatarIcon: {
            width: isNested ? 24 : 28,
            height: isNested ? 24 : 28,
            fontSize: isNested ? ".75rem" : ".875rem",
            backgroundColor: theme.palette.mode === 'light'
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.primary.main, 0.2),
            color: theme.palette.mode === 'light'
                ? theme.palette.primary.main
                : theme.palette.primary.light,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            transition: "all 0.2s ease",
        },
        childList: {
            paddingLeft: 2,
        },
        expandIcon: {
            transition: "transform 0.3s ease",
            color: theme.palette.text.secondary,
        },
        nestedIndicator: {
            position: "absolute",
            left: 0,
            width: 3,
            height: "60%",
            borderRadius: "0 4px 4px 0",
            backgroundColor: theme.palette.primary.main,
            opacity: 0,
            transition: "opacity 0.2s ease",
        },
        itemText: {
            fontWeight: open || isCurrentRoute || safeItem.selected ? 500 : 400,
            fontSize: isNested ? "0.875rem" : "0.9375rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: isCurrentRoute || safeItem.selected
                ? theme.palette.primary.main
                : theme.palette.text.primary,
            transition: "color 0.2s ease, font-weight 0.2s ease",
        },
        submenuIcon: {
            fontSize: isNested ? 16 : 20,
            transition: "transform 0.3s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }
    };

    const handleToggle = useCallback(() => {
        setOpen((prev) => !prev);
    }, []);

    const handleClick = useCallback((route) => (e) => {
        e?.preventDefault();
        if (route) {
            onNavigate(route)();
        }
        if (hasSubmenu) {
            handleToggle();
        }
    }, [onNavigate, handleToggle, hasSubmenu]);

    const renderIcon = () => {
        if (safeItem.icon && React.isValidElement(safeItem.icon)) {
            return React.cloneElement(safeItem.icon, {
                fontSize: isNested ? "small" : "medium",
                style: {
                    color: isCurrentRoute || safeItem.selected
                        ? theme.palette.primary.main
                        : 'inherit'
                }
            });
        } else if (safeItem.icon && typeof safeItem.icon === "string") {
            return (
                <Avatar
                    variant="rounded"
                    src={safeItem.icon}
                    sx={styles.avatarIcon}
                    alt={`${safeItem.title} icon`}
                />
            );
        } else {
            return (
                <Avatar
                    variant="rounded"
                    sx={styles.avatarIcon}
                >
                    {safeItem.title.charAt(0).toUpperCase()}
                </Avatar>
            );
        }
    };

    const menuItemContent = (
        <ListItemButton
            sx={{
                ...styles.listItem,
                position: "relative",
                "&::before": isNested ? {
                    content: '""',
                    position: "absolute",
                    left: "-8px",
                    width: "3px",
                    height: "60%",
                    borderRadius: "0 4px 4px 0",
                    backgroundColor: theme.palette.primary.main,
                    opacity: isCurrentRoute || safeItem.selected ? 1 : 0,
                    transition: "opacity 0.2s ease",
                } : {},
                "&:hover::before": isNested ? {
                    opacity: 0.5,
                } : {},
            }}
            onClick={handleClick(safeItem.route)}
            href={safeItem.route || undefined}
            selected={isCurrentRoute || safeItem.selected}
            disableRipple
        >
            <ListItemIcon sx={styles.icon}>
                {renderIcon()}
            </ListItemIcon>
            <ListItemText
                primary={safeItem.title}
                primaryTypographyProps={{
                    sx: styles.itemText,
                    noWrap: true
                }}
            />
            {hasSubmenu && (
                open ?
                    <ExpandLess sx={styles.submenuIcon}/> :
                    <ExpandMore sx={styles.submenuIcon}/>
            )}
        </ListItemButton>
    );

    // Use tooltip only for top-level items when not expanded
    const wrappedMenuItem = isNested ? (
        menuItemContent
    ) : (
        <Tooltip
            title={safeItem.title}
            placement="right"
            arrow
            disableHoverListener={open}
            enterDelay={500}
        >
            {menuItemContent}
        </Tooltip>
    );

    return (
        <>
            {wrappedMenuItem}

            {hasSubmenu && (
                <Collapse in={open} timeout={300} unmountOnExit>
                    <List component="div" disablePadding sx={styles.childList}>
                        {safeItem.child.map((child, index) => (
                            <MenuItem
                                key={`${child?.title || 'item'}-${index}`}
                                item={child}
                                permissions={permissions}
                                onNavigate={onNavigate}
                                isNested={true}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
});

MenuItem.displayName = 'MenuItem';

MenuItem.propTypes = {
    item: PropTypes.shape({
        title: PropTypes.string,
        route: PropTypes.string,
        icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string, PropTypes.element]),
        permission: PropTypes.string,
        child: PropTypes.array,
        selected: PropTypes.bool
    }).isRequired,
    permissions: PropTypes.arrayOf(PropTypes.string).isRequired,
    onNavigate: PropTypes.func.isRequired,
    isNested: PropTypes.bool
};

export default MenuItem;
