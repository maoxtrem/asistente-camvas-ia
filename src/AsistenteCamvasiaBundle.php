<?php

declare(strict_types=1);

namespace Maoxtrem\AsistenteCamvasia;

use Symfony\Component\HttpKernel\Bundle\Bundle;

final class AsistenteCamvasiaBundle extends Bundle
{
    public function getPath(): string
    {
        return \dirname(__DIR__);
    }
}
