import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { UsersTableExtendedUser as ExtendedUser } from '@/lib/utils/tables/users-table'
import { getHotkeyHandler } from '@mantine/hooks'
import { CellContext } from '@tanstack/react-table'
import { AlertTriangle, Check, Ellipsis, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FC, useState } from 'react'

interface ActionsCellProps extends CellContext<ExtendedUser, unknown> {}

const ActionsCell: FC<ActionsCellProps> = ({ row, table }) => {
  const t = useTranslations('Pages.Users.Table.Client.Actions')

  // ui state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const openDialog = () => setDialogOpen(true)
  const closeDialog = () => setDialogOpen(false)
  const closeDropdown = () => setDropdownOpen(false)

  // state checkers
  const id = row.original.id
  const tableCtx = table.options.meta?.usersTable

  const isInEditMode = tableCtx?.getters.isInEditMode(id)
  const isLoading = tableCtx?.getters.isLoading(id)
  const isDeleting = tableCtx?.getters.isDeleting(id)
  const isUserDirty = tableCtx?.getters.isUserDirty(id)
  const isInErrorState = tableCtx?.getters.isInErrorState(id)

  const isAssigned = !!row.original.workspaceId

  // actions
  const deleteUser = () => {
    tableCtx?.actions.deleteUser(id, {
      onSuccess() {
        closeDialog()
        closeDropdown()
      },
    })
  }

  // hotkeys handler
  const handleHotkeys = getHotkeyHandler([['mod+d', openDialog]])

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {isInEditMode ? (
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            onClick={() => (isUserDirty ? tableCtx?.actions.saveUser(id) : tableCtx?.setters.editMode.removeFromEditMode(id))}
            size='icon'
            disabled={isLoading || !isAssigned || isDeleting}
          >
            {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Check className='h-4 w-4' />}
            <span className='sr-only'>{t('save-mods')}</span>
          </Button>
          <Button variant='outline' onClick={() => tableCtx?.actions.revertUser(id)} size='icon' disabled={isLoading || isDeleting}>
            <X className='h-4 w-4' />
            <span className='sr-only'>{t('revert-mods')}</span>
          </Button>
          {isInErrorState && <AlertTriangle className='inline h-6 w-6 text-destructive-foreground' />}
        </div>
      ) : !isAssigned ? (
        <div className='flex items-center gap-1'>
          <Button variant='outline' size='icon' onClick={() => tableCtx?.actions.editUser(id)} disabled={isDeleting || dialogOpen}>
            <Check className='h-4 w-4' />
            <span className='sr-only'>{t('accept')}</span>
          </Button>
          <Button variant='outline' size='icon' onClick={() => openDialog()} disabled={isDeleting || dialogOpen}>
            {isDeleting ? <Loader2 className='h-4 w-4 animate-spin' /> : <X className='h-4 w-4' />}
            <span className='sr-only'>{t('Delete.label')}</span>
          </Button>
          {isInErrorState && <AlertTriangle className='inline h-6 w-6 text-destructive-foreground' />}
        </div>
      ) : (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <div className='flex items-center gap-2'>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='data-[state=open]:bg-muted' disabled={isDeleting}>
                {isDeleting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Ellipsis className='h-4 w-4' />}
                <span className='sr-only'>{t('open-menu')}</span>
              </Button>
            </DropdownMenuTrigger>
            {isInErrorState && <AlertTriangle className='inline h-6 w-6 text-destructive-foreground' />}
          </div>
          <DropdownMenuContent align='end' className='w-[160px]' onKeyDown={handleHotkeys}>
            <DropdownMenuItem onSelect={() => tableCtx?.actions.editUser(id)}>{t('edit')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className='text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground'>
              <DialogTrigger asChild>
                <span className='flex w-full items-center justify-between'>
                  {t('Delete.label')}
                  <DropdownMenuShortcut>{isDeleting ? <Loader2 className='h-4 w-4 animate-spin' /> : '⌘D'}</DropdownMenuShortcut>
                </span>
              </DialogTrigger>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Delete.Confirmation.heading', { user: row.original.name })}</DialogTitle>
          <DialogDescription>{t('Delete.Confirmation.sub-heading', { count: 1 })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='secondary' disabled={isDeleting}>
              {t('Delete.Confirmation.revert')}
            </Button>
          </DialogClose>
          <Button type='button' onClick={deleteUser} disabled={isDeleting}>
            {!isDeleting ? t('Delete.label') : <Loader2 className='h-4 w-4 animate-spin' />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ActionsCell
