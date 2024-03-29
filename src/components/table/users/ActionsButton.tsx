import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { UsersTableExtendedUser as ExtendedUser } from '@/lib/utils/tables/users-table'
import { getHotkeyHandler } from '@mantine/hooks'
import { Table } from '@tanstack/react-table'
import { Ellipsis, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface ActionsButtonProps<TData> {
  table: Table<TData>
}

function ActionsButton<TData extends ExtendedUser>({ table }: ActionsButtonProps<TData>) {
  const t = useTranslations('Pages.Users.Table.Client.Actions')
  const tableCtx = table.options.meta?.usersTable

  // ui state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const openDialog = () => setDialogOpen(true)
  const closeDialog = () => setDialogOpen(false)
  const closeDropdown = () => setDropdownOpen(false)

  // state checkers
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const areRowsSelected = selectedRows.length > 0

  const isDeleting = selectedRows.some((row) => tableCtx?.getters.isDeleting(row.original.id))

  // actions
  const deleteUsers = async () => {
    tableCtx?.actions.deleteUsers(
      selectedRows.map((row) => row.original.id),
      {
        onSuccess() {
          closeDialog()
          closeDropdown()
        },
      }
    )
  }

  // hotkeys handler
  const handleHotkeys = getHotkeyHandler([['mod+D', openDialog]])

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='icon' className='h-8 w-8'>
            <Ellipsis className='h-4 w-4' />
            <span className='sr-only'>{t('label')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' onKeyDown={handleHotkeys}>
          <DropdownMenuItem
            asChild
            className='text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground'
            disabled={!areRowsSelected}
          >
            <DialogTrigger asChild>
              <span className='flex w-full items-center justify-between'>
                {t('Delete.label')}
                <DropdownMenuShortcut>{isDeleting ? <Loader2 className='h-4 w-4 animate-spin' /> : '⌘D'}</DropdownMenuShortcut>
              </span>
            </DialogTrigger>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedRows.length === 1
              ? t('Delete.Confirmation.heading', { user: selectedRows[0].original.name })
              : t('Delete.Confirmation.heading-multiple', { count: selectedRows.length })}
          </DialogTitle>
          <DialogDescription>{t('Delete.Confirmation.sub-heading', {count: selectedRows.length})}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='secondary' disabled={isDeleting}>
              {t('Delete.Confirmation.revert')}
            </Button>
          </DialogClose>
          <Button type='button' onClick={deleteUsers} disabled={isDeleting}>
            {isDeleting ? <Loader2 className='h-4 w-4 animate-spin' /> : t('Delete.label')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ActionsButton
