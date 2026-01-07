'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface MenuItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    roles?: string[];
    children?: MenuItem[];
}

export default function SidebarItem({ item, pathname, onItemClick }: { item: MenuItem; pathname: string; onItemClick: () => void }) {
    const [isOpen, setIsOpen] = useState(false);

    // Auto-open if child is active
    useEffect(() => {
        if (item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))) {
            setIsOpen(true);
        }
    }, [pathname, item.children]);

    const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/')));
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        'flex items-center w-full gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 justify-between',
                        isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    )}
                >
                    <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.name}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen ? "rotate-180" : "")} />
                </button>

                {isOpen && (
                    <div className="pl-4 space-y-1">
                        {item.children!.map((child, idx) => {
                            const isChildActive = pathname === child.href;
                            return (
                                <Link
                                    key={idx}
                                    href={child.href}
                                    onClick={onItemClick}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                                        isChildActive
                                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    )}
                                >
                                    {child.icon}
                                    <span>{child.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            onClick={onItemClick}
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            )}
        >
            {item.icon}
            <span>{item.name}</span>
        </Link>
    );
}
